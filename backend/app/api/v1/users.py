"""
User management routes scoped to an organisation.

RBAC enforcement:
  - POST   /orgs/{org_id}/invite          → org_admin (own org) | super_admin
  - GET    /orgs/{org_id}/users           → team_lead (own org) | org_admin | super_admin
  - PATCH  /orgs/{org_id}/users/{user_id} → org_admin (own org) | super_admin
  - DELETE /orgs/{org_id}/users/{user_id} → org_admin (own org) | super_admin
"""
import logging
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.schemas.base import ok
from app.schemas.user import InviteUserRequest, UpdateRoleRequest
from app.core.permissions import (
    UserRole,
    require_min_role,
    assert_same_org,
)
from app.services import user_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/orgs", tags=["users"])


# ── POST /orgs/{org_id}/invite ────────────────────────────────────────────────

@router.post("/{org_id}/invite", status_code=201)
async def invite_user(
    org_id: UUID,
    body: InviteUserRequest,
    current_user: User = Depends(require_min_role(UserRole.ORG_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    assert_same_org(current_user, org_id)
    result = await user_service.invite_user(
        db,
        org_id=org_id,
        email=body.email,
        role=body.role,
        invited_by=current_user,
    )
    logger.info(
        "User invited",
        extra={"user_id": str(current_user.id), "org_id": str(org_id)},
    )
    return ok(result)


# ── GET /orgs/{org_id}/users ──────────────────────────────────────────────────

@router.get("/{org_id}/users")
async def list_org_users(
    org_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_min_role(UserRole.TEAM_LEAD)),
    db: AsyncSession = Depends(get_db),
):
    assert_same_org(current_user, org_id)
    items, total = await user_service.get_org_users(
        db,
        org_id=org_id,
        requesting_user=current_user,
        page=page,
        page_size=page_size,
    )
    return ok(
        [
            {
                "user_id": str(u.id),
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role,
                "is_active": u.is_active,
                "joined_at": u.created_at.isoformat(),
            }
            for u in items
        ],
        meta={"total": total, "page": page, "page_size": page_size},
    )


# ── PATCH /orgs/{org_id}/users/{user_id} ─────────────────────────────────────

@router.patch("/{org_id}/users/{user_id}")
async def update_user_role(
    org_id: UUID,
    user_id: UUID,
    body: UpdateRoleRequest,
    current_user: User = Depends(require_min_role(UserRole.ORG_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    assert_same_org(current_user, org_id)
    user = await user_service.update_user_role(
        db,
        org_id=org_id,
        target_user_id=user_id,
        new_role=body.role,
        requesting_user=current_user,
    )
    logger.info(
        "User role updated",
        extra={
            "user_id": str(current_user.id),
            "target_user_id": str(user_id),
            "org_id": str(org_id),
        },
    )
    return ok({
        "user_id": str(user.id),
        "role": user.role,
        "updated_at": user.updated_at.isoformat(),
    })


# ── DELETE /orgs/{org_id}/users/{user_id} ────────────────────────────────────

@router.delete("/{org_id}/users/{user_id}")
async def remove_user(
    org_id: UUID,
    user_id: UUID,
    current_user: User = Depends(require_min_role(UserRole.ORG_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    assert_same_org(current_user, org_id)
    await user_service.remove_user_from_org(
        db,
        org_id=org_id,
        target_user_id=user_id,
        requesting_user=current_user,
    )
    logger.info(
        "User removed",
        extra={
            "user_id": str(current_user.id),
            "target_user_id": str(user_id),
            "org_id": str(org_id),
        },
    )
    return ok({"user_id": str(user_id), "removed": True})
