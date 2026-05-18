"""
API Key management routes — role-scoped.

RBAC enforcement:
  - POST   /api-keys              → any authenticated user (scoped by role)
  - GET    /api-keys              → any authenticated user (scoped by role)
  - POST   /api-keys/{key_id}/rotate → assert_can_manage_key()
  - DELETE /api-keys/{key_id}     → assert_can_manage_key()
"""
import logging
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.schemas.base import ok
from app.schemas.api_key import ApiKeyCreateRequest
from app.dependencies import get_current_user
from app.services import api_key_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api-keys", tags=["api-keys"])


# ── POST /api-keys ────────────────────────────────────────────────────────────

@router.post("", status_code=201)
async def create_key(
    body: ApiKeyCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # user_id defaults to caller if omitted
    owner_user_id = body.user_id if body.user_id else current_user.id
    org_id = current_user.org_id

    api_key, plaintext = await api_key_service.create_api_key(
        db,
        name=body.name,
        owner_user_id=owner_user_id,
        org_id=org_id,
        rate_limit_rpm=body.rate_limit_rpm,
        expires_at=body.expires_at,
        requesting_user=current_user,
    )
    logger.info(
        "API key created",
        extra={
            "user_id": str(current_user.id),
            "key_id": str(api_key.id),
            "key_prefix": api_key.key_prefix,
        },
    )
    return ok({
        "key_id": str(api_key.id),
        "name": api_key.name,
        "api_key": plaintext,
        "prefix": api_key.key_prefix,
        "user_id": str(api_key.user_id),
        "org_id": str(api_key.org_id),
        "rate_limit_rpm": api_key.rate_limit_rpm,
        "created_at": api_key.created_at.isoformat(),
        "expires_at": api_key.expires_at.isoformat() if api_key.expires_at else None,
    })


# ── GET /api-keys ─────────────────────────────────────────────────────────────

@router.get("")
async def list_keys(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: UUID | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    items, total = await api_key_service.list_keys(
        db,
        requesting_user=current_user,
        filter_user_id=user_id,
        page=page,
        page_size=page_size,
    )
    return ok(
        [
            {
                "key_id": str(k.id),
                "name": k.name,
                "prefix": k.key_prefix,
                "is_active": k.is_active,
                "rate_limit_rpm": k.rate_limit_rpm,
                "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None,
                "expires_at": k.expires_at.isoformat() if k.expires_at else None,
                "user_id": str(k.user_id),
                "org_id": str(k.org_id),
            }
            for k in items
        ],
        meta={"total": total, "page": page, "page_size": page_size},
    )


# ── POST /api-keys/{key_id}/rotate ───────────────────────────────────────────

@router.post("/{key_id}/rotate")
async def rotate_key(
    key_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    api_key, plaintext = await api_key_service.rotate_key(
        db, key_id=key_id, requesting_user=current_user
    )
    logger.info(
        "API key rotated",
        extra={
            "user_id": str(current_user.id),
            "key_id": str(key_id),
        },
    )
    return ok({
        "key_id": str(api_key.id),
        "api_key": plaintext,
        "prefix": api_key.key_prefix,
        "rotated_at": datetime.now(timezone.utc).isoformat(),
    })


# ── DELETE /api-keys/{key_id} ─────────────────────────────────────────────────

@router.delete("/{key_id}")
async def revoke_key(
    key_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    api_key = await api_key_service.revoke_key(
        db, key_id=key_id, requesting_user=current_user
    )
    logger.info(
        "API key revoked",
        extra={
            "user_id": str(current_user.id),
            "key_id": str(key_id),
        },
    )
    return ok({
        "key_id": str(api_key.id),
        "revoked": True,
        "revoked_at": api_key.revoked_at.isoformat() if api_key.revoked_at else None,
    })
