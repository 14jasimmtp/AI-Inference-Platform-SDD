"""
API Key service — role-scoped create, list, rotate, revoke.
All DB operations for API key lifecycle.
"""
import secrets
import hashlib
import logging
from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError

from app.models.api_key import ApiKey
from app.models.user import User
from app.core.permissions import assert_can_manage_key, UserRole
from app.exceptions import NotFoundError, ForbiddenError, ConflictError

logger = logging.getLogger(__name__)


def generate_api_key() -> tuple[str, str, str]:
    """
    Generate a new API key.
    Returns (plaintext, sha256_hex_hash, prefix).
    Plaintext is NEVER persisted — shown once to the user.
    """
    raw = secrets.token_urlsafe(32)
    plaintext = f"sk-{raw}"
    key_hash = hashlib.sha256(plaintext.encode()).hexdigest()
    prefix = plaintext[:7]
    return plaintext, key_hash, prefix


async def create_api_key(
    db: AsyncSession,
    name: str,
    owner_user_id: UUID,
    org_id: UUID,
    rate_limit_rpm: int,
    expires_at: datetime | None,
    requesting_user: User,
) -> tuple[ApiKey, str]:
    """
    Create an API key for a user, respecting role scoping.
    Returns (ApiKey model, plaintext) — plaintext never persisted.
    """
    # Scope check: who can create keys for whom?
    if str(requesting_user.id) != str(owner_user_id):
        # Trying to create key for someone else
        if requesting_user.role == UserRole.USER.value:
            raise ForbiddenError("You can only create keys for your own account")

        # Verify target user exists
        result = await db.execute(select(User).where(User.id == owner_user_id))
        target_user = result.scalar_one_or_none()
        if not target_user:
            raise NotFoundError("Target user not found")

        # Verify target user is in the same org (unless super_admin)
        if requesting_user.role != UserRole.SUPER_ADMIN.value:
            if str(target_user.org_id) != str(requesting_user.org_id):
                raise ForbiddenError(
                    "Cannot create API key for user outside your organisation"
                )

    plaintext, key_hash, prefix = generate_api_key()

    api_key = ApiKey(
        user_id=owner_user_id,
        org_id=org_id,
        name=name,
        key_hash=key_hash,
        key_prefix=prefix,
        rate_limit_rpm=rate_limit_rpm,
        expires_at=expires_at,
    )
    db.add(api_key)
    try:
        await db.commit()
        await db.refresh(api_key)
    except IntegrityError:
        await db.rollback()
        raise ConflictError("Failed to create API key")

    logger.info(
        "API key created",
        extra={
            "key_id": str(api_key.id),
            "key_prefix": prefix,
            "user_id": str(owner_user_id),
            "org_id": str(org_id),
            "created_by": str(requesting_user.id),
        },
    )
    return api_key, plaintext


async def list_keys(
    db: AsyncSession,
    requesting_user: User,
    filter_user_id: UUID | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[ApiKey], int]:
    """
    List API keys scoped by the requesting user's role:
    - super_admin → all keys
    - org_admin → all keys in own org
    - team_lead → all keys in own org (phase 3 = org scoped)
    - user → own keys only; filter_user_id ignored
    """
    query = select(ApiKey)
    count_query = select(func.count(ApiKey.id))

    role = requesting_user.role

    if role == UserRole.SUPER_ADMIN.value:
        # All keys; optionally filter by user_id
        if filter_user_id:
            query = query.where(ApiKey.user_id == filter_user_id)
            count_query = count_query.where(ApiKey.user_id == filter_user_id)
    elif role in (UserRole.ORG_ADMIN.value, UserRole.TEAM_LEAD.value):
        # All keys in own org
        query = query.where(ApiKey.org_id == requesting_user.org_id)
        count_query = count_query.where(ApiKey.org_id == requesting_user.org_id)
        if filter_user_id:
            query = query.where(ApiKey.user_id == filter_user_id)
            count_query = count_query.where(ApiKey.user_id == filter_user_id)
    else:
        # Regular user — own keys only, ignore filter
        query = query.where(ApiKey.user_id == requesting_user.id)
        count_query = count_query.where(ApiKey.user_id == requesting_user.id)

    count_result = await db.execute(count_query)
    total = count_result.scalar()

    offset = (page - 1) * page_size
    query = query.order_by(ApiKey.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    items = list(result.scalars().all())
    return items, total


async def rotate_key(
    db: AsyncSession,
    key_id: UUID,
    requesting_user: User,
) -> tuple[ApiKey, str]:
    """
    Rotate an API key — generate new plaintext, invalidate old hash.
    Returns (updated ApiKey, new plaintext).
    """
    result = await db.execute(select(ApiKey).where(ApiKey.id == key_id))
    api_key = result.scalar_one_or_none()
    if not api_key or not api_key.is_active:
        raise NotFoundError("API key not found or already revoked")

    await assert_can_manage_key(requesting_user, api_key)

    plaintext, key_hash, prefix = generate_api_key()
    api_key.key_hash = key_hash
    api_key.key_prefix = prefix
    await db.commit()
    await db.refresh(api_key)

    logger.info(
        "API key rotated",
        extra={
            "key_id": str(key_id),
            "key_prefix": prefix,
            "rotated_by": str(requesting_user.id),
        },
    )
    return api_key, plaintext


async def revoke_key(
    db: AsyncSession,
    key_id: UUID,
    requesting_user: User,
) -> ApiKey:
    """
    Revoke an API key (soft delete — sets is_active=False, revoked_at).
    Returns 409 if already revoked.
    """
    result = await db.execute(select(ApiKey).where(ApiKey.id == key_id))
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise NotFoundError("API key not found")

    if not api_key.is_active:
        raise ConflictError("API key is already revoked")

    await assert_can_manage_key(requesting_user, api_key)

    api_key.is_active = False
    api_key.revoked_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(api_key)

    logger.info(
        "API key revoked",
        extra={
            "key_id": str(key_id),
            "revoked_by": str(requesting_user.id),
        },
    )
    return api_key


# ── Legacy compatibility ─────────────────────────────────────────────────────
# Keep the class-based interface alive for the inference auth flow

class ApiKeyService:
    """Backwards-compatible wrapper for inference authentication."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def authenticate_by_key(self, raw_key: str, db: AsyncSession) -> ApiKey:
        """Validate raw API key. Returns the ApiKey object or raises UnauthorizedError."""
        from app.exceptions import UnauthorizedError
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        result = await db.execute(
            select(ApiKey).where(
                ApiKey.key_hash == key_hash,
                ApiKey.is_active == True,
            )
        )
        api_key = result.scalar_one_or_none()
        if not api_key:
            raise UnauthorizedError("Invalid or revoked API key")

        api_key.last_used_at = datetime.now(timezone.utc)
        await db.commit()
        return api_key
