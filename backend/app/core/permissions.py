"""
RBAC permission enforcement for the AI Inference Platform.

All role checks are centralised here — zero inline `if user.role ==` checks
in route handlers or service functions.
"""
import logging
from enum import Enum
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_current_user
from app.exceptions import ForbiddenError
from app.models.user import User

logger = logging.getLogger(__name__)


# ── Role definitions ──────────────────────────────────────────────────────────

class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    ORG_ADMIN   = "org_admin"
    TEAM_LEAD   = "team_lead"
    USER        = "user"


ROLE_HIERARCHY = {
    UserRole.SUPER_ADMIN: 4,
    UserRole.ORG_ADMIN:   3,
    UserRole.TEAM_LEAD:   2,
    UserRole.USER:        1,
}

# Mapping from the ORM enum values to our hierarchy for lookup
_ROLE_HIERARCHY_BY_VALUE = {
    "super_admin": 4,
    "org_admin":   3,
    "team_lead":   2,
    "user":        1,
}


# ── Role-assignment constraints ───────────────────────────────────────────────

ASSIGNABLE_ROLES_BY_ROLE = {
    "super_admin": {"org_admin", "team_lead", "user"},
    "org_admin":   {"team_lead", "user"},
    "team_lead":   set(),
    "user":        set(),
}


# ── Dependency factories ─────────────────────────────────────────────────────

def require_role(*roles: UserRole):
    """FastAPI Depends() factory — caller must hold one of the listed roles."""
    async def dependency(current_user: User = Depends(get_current_user)):
        if current_user.role not in [r.value for r in roles]:
            logger.warning(
                "Role check failed",
                extra={
                    "user_id": str(current_user.id),
                    "user_role": current_user.role,
                    "required_roles": [r.value for r in roles],
                },
            )
            raise ForbiddenError(
                f"Role '{current_user.role}' is not permitted for this action"
            )
        return current_user
    return dependency


def require_min_role(min_role: UserRole):
    """FastAPI Depends() factory — caller must meet minimum role level."""
    min_level = ROLE_HIERARCHY[min_role]

    async def dependency(current_user: User = Depends(get_current_user)):
        caller_level = _ROLE_HIERARCHY_BY_VALUE.get(current_user.role, 0)
        if caller_level < min_level:
            logger.warning(
                "Min-role check failed",
                extra={
                    "user_id": str(current_user.id),
                    "user_role": current_user.role,
                    "min_role": min_role.value,
                },
            )
            raise ForbiddenError(
                f"Minimum role '{min_role.value}' required"
            )
        return current_user
    return dependency


# ── Helper functions ──────────────────────────────────────────────────────────

def assert_same_org(current_user: User, target_org_id) -> None:
    """
    Verify the caller belongs to the target organisation.
    super_admin bypasses this check.
    Must be called BEFORE any service function on every org-scoped route.
    """
    if current_user.role == UserRole.SUPER_ADMIN.value:
        return
    if str(current_user.org_id) != str(target_org_id):
        logger.warning(
            "Cross-org access denied",
            extra={
                "user_id": str(current_user.id),
                "user_org_id": str(current_user.org_id),
                "target_org_id": str(target_org_id),
            },
        )
        raise ForbiddenError("Access to this organisation is not permitted")


def assert_can_assign_role(assigning_user: User, target_role: str) -> None:
    """
    Verify the assigning user is allowed to grant the target role.
    """
    allowed = ASSIGNABLE_ROLES_BY_ROLE.get(assigning_user.role, set())
    if target_role not in allowed:
        raise ForbiddenError(
            f"Role '{target_role}' cannot be assigned by '{assigning_user.role}'"
        )


async def assert_can_manage_key(current_user: User, api_key) -> None:
    """
    Verify the caller is permitted to rotate/revoke the given API key.
    """
    if current_user.role == UserRole.SUPER_ADMIN.value:
        return

    if str(current_user.org_id) != str(api_key.org_id):
        raise ForbiddenError("Key does not belong to your organisation")

    if current_user.role == UserRole.ORG_ADMIN.value:
        return

    if current_user.role == UserRole.TEAM_LEAD.value:
        # Phase 3: team = all users in same org
        if str(api_key.org_id) != str(current_user.org_id):
            raise ForbiddenError("Key is outside your team scope")
        return

    # Regular user — own keys only
    if str(api_key.user_id) != str(current_user.id):
        raise ForbiddenError("You can only manage your own keys")
