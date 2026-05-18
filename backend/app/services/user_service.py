"""
User service — invite, role assignment, listing, removal.
All DB operations for user lifecycle within an organisation.
"""
import uuid
import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError

from app.models.user import User
from app.models.api_key import ApiKey
from app.core.auth import get_password_hash
from app.core.permissions import assert_can_assign_role, assert_same_org
from app.exceptions import (
    NotFoundError,
    ForbiddenError,
    ConflictError,
    ValidationError,
)

logger = logging.getLogger(__name__)


async def invite_user(
    db: AsyncSession,
    org_id: uuid.UUID,
    email: str,
    role: str,
    invited_by: User,
) -> dict:
    """
    Invite a user into an organisation.
    - org_admin can invite team_lead, user within own org.
    - super_admin can invite org_admin, team_lead, user into any org.
    Raises ConflictError if email already exists in this org.
    """
    # Verify assigner is permitted to grant this role
    assert_can_assign_role(invited_by, role)

    # Check if user already exists with this email
    result = await db.execute(
        select(User).where(User.email == email)
    )
    user = result.scalar_one_or_none()
    
    if user:
        if str(user.org_id) == str(org_id):
            raise ConflictError(f"User '{email}' is already a member of this organisation")
        
        # Update existing user's org and role
        user.org_id = org_id
        # Never downgrade a super_admin to something lower
        if user.role != "super_admin":
            user.role = role
        logger.info(f"Updated existing user {email} org to {org_id}")
    else:
        # Create user with a temporary password (they will reset it)
        temp_password = f"invite-{uuid.uuid4().hex[:16]}"
        user = User(
            email=email,
            full_name=email.split("@")[0],  # placeholder name
            password_hash=get_password_hash(temp_password),
            role=role,
            org_id=org_id,
            is_active=True,
        )
        db.add(user)

    try:
        await db.commit()
        await db.refresh(user)
    except IntegrityError:
        await db.rollback()
        raise ConflictError(f"User with email '{email}' already exists")

    logger.info(
        "User invited",
        extra={
            "invite_id": str(user.id),
            "email": email,
            "role": role,
            "org_id": str(org_id),
            "invited_by": str(invited_by.id),
        },
    )

    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    return {
        "invite_id": str(user.id),
        "email": email,
        "role": role,
        "org_id": str(org_id),
        "expires_at": expires_at.isoformat(),
    }


async def get_org_users(
    db: AsyncSession,
    org_id: uuid.UUID,
    requesting_user: User,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[User], int]:
    """List all users in an organisation with pagination."""
    count_result = await db.execute(
        select(func.count(User.id)).where(User.org_id == org_id)
    )
    total = count_result.scalar()

    offset = (page - 1) * page_size
    result = await db.execute(
        select(User)
        .where(User.org_id == org_id)
        .order_by(User.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    items = list(result.scalars().all())
    return items, total


async def update_user_role(
    db: AsyncSession,
    org_id: uuid.UUID,
    target_user_id: uuid.UUID,
    new_role: str,
    requesting_user: User,
) -> User:
    """
    Update a user's role within an organisation.
    Raises NotFoundError if user not in this org.
    """
    # Verify permission to assign target role
    assert_can_assign_role(requesting_user, new_role)

    result = await db.execute(
        select(User).where(
            User.id == target_user_id,
            User.org_id == org_id,
        )
    )
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise NotFoundError("User not found in this organisation")

    target_user.role = new_role
    await db.commit()
    await db.refresh(target_user)
    logger.info(
        "User role updated",
        extra={
            "target_user_id": str(target_user_id),
            "new_role": new_role,
            "org_id": str(org_id),
            "updated_by": str(requesting_user.id),
        },
    )
    return target_user


async def remove_user_from_org(
    db: AsyncSession,
    org_id: uuid.UUID,
    target_user_id: uuid.UUID,
    requesting_user: User,
) -> None:
    """
    Remove a user from an organisation.
    Also revokes all their active API keys (cascade revocation).
    Raises ValidationError if trying to remove self.
    """
    if str(requesting_user.id) == str(target_user_id):
        raise ValidationError("Cannot remove yourself from the organisation")

    result = await db.execute(
        select(User).where(
            User.id == target_user_id,
            User.org_id == org_id,
        )
    )
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise NotFoundError("User not found in this organisation")

    # Cascade revoke all active API keys for this user
    keys_result = await db.execute(
        select(ApiKey).where(
            ApiKey.user_id == target_user_id,
            ApiKey.is_active == True,
        )
    )
    active_keys = keys_result.scalars().all()
    now = datetime.now(timezone.utc)
    for key in active_keys:
        key.is_active = False
        key.revoked_at = now

    # Deactivate user
    target_user.is_active = False
    await db.commit()

    logger.info(
        "User removed from org",
        extra={
            "target_user_id": str(target_user_id),
            "org_id": str(org_id),
            "removed_by": str(requesting_user.id),
            "keys_revoked": len(active_keys),
        },
    )
