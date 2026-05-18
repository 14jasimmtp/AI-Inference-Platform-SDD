"""
Organisation CRUD routes.

RBAC enforcement:
  - POST /orgs               → super_admin only
  - GET  /orgs               → super_admin only
  - GET  /orgs/{org_id}      → org_admin (own org) | super_admin (any)
  - PUT  /orgs/{org_id}      → org_admin (own org) | super_admin (any)
  - DELETE /orgs/{org_id}    → super_admin only
"""
import logging
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.schemas.base import ok
from app.schemas.org import OrgCreateRequest, OrgUpdateRequest
from app.core.permissions import (
    UserRole,
    require_role,
    require_min_role,
    assert_same_org,
)
from app.dependencies import get_current_user
from app.services import org_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/orgs", tags=["organisations"])


# ── POST /orgs ────────────────────────────────────────────────────────────────

@router.post("", status_code=201)
async def create_org(
    body: OrgCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org = await org_service.create_org(
        db, 
        name=body.name, 
        slug=body.slug, 
        creator=current_user
    )

    logger.info(
        "Organisation created",
        extra={"user_id": str(current_user.id), "org_id": str(org.id)},
    )
    return ok({
        "org_id": str(org.id),
        "name": org.name,
        "slug": org.slug,
        "created_at": org.created_at.isoformat(),
    })


# ── GET /orgs ─────────────────────────────────────────────────────────────────

@router.get("")
async def list_orgs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role == UserRole.SUPER_ADMIN.value:
        items, total = await org_service.list_orgs(db, page=page, page_size=page_size)
    else:
        if not current_user.org_id:
            return ok([], meta={"total": 0, "page": page, "page_size": page_size})
        org = await org_service.get_org(db, current_user.org_id)
        items = [org]
        total = 1

    return ok(
        [
            {
                "org_id": str(o.id),
                "name": o.name,
                "slug": o.slug,
                "is_active": o.is_active,
                "created_at": o.created_at.isoformat(),
            }
            for o in items
        ],
        meta={"total": total, "page": page, "page_size": page_size},
    )


# ── GET /orgs/{org_id} ───────────────────────────────────────────────────────

@router.get("/{org_id}")
async def get_org(
    org_id: UUID,
    current_user: User = Depends(require_min_role(UserRole.ORG_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    assert_same_org(current_user, org_id)
    org = await org_service.get_org(db, org_id)
    stats = await org_service.get_org_stats(db, org_id)
    return ok({
        "org_id": str(org.id),
        "name": org.name,
        "slug": org.slug,
        "is_active": org.is_active,
        "member_count": stats["member_count"],
        "active_keys": stats["active_keys"],
        "created_at": org.created_at.isoformat(),
        "updated_at": org.updated_at.isoformat(),
    })


# ── PUT /orgs/{org_id} ───────────────────────────────────────────────────────

@router.put("/{org_id}")
async def update_org(
    org_id: UUID,
    body: OrgUpdateRequest,
    current_user: User = Depends(require_min_role(UserRole.ORG_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    assert_same_org(current_user, org_id)
    org = await org_service.update_org(db, org_id, name=body.name)
    logger.info(
        "Organisation updated",
        extra={"user_id": str(current_user.id), "org_id": str(org_id)},
    )
    return ok({
        "org_id": str(org.id),
        "name": org.name,
        "updated_at": org.updated_at.isoformat(),
    })


# ── DELETE /orgs/{org_id} ────────────────────────────────────────────────────

@router.delete("/{org_id}")
async def delete_org(
    org_id: UUID,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    await org_service.delete_org(db, org_id)
    logger.info(
        "Organisation deleted",
        extra={"user_id": str(current_user.id), "org_id": str(org_id)},
    )
    return ok({"org_id": str(org_id), "deleted": True})
