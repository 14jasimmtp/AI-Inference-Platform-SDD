"""
Organisation service — all DB operations for organisation CRUD.
No database calls should happen outside of service functions.
"""
import logging
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError

from app.models.organisation import Organisation
from app.models.user import User
from app.models.api_key import ApiKey
from app.exceptions import NotFoundError, ConflictError

logger = logging.getLogger(__name__)


async def create_org(db: AsyncSession, name: str, slug: str, creator: User | None = None) -> Organisation:
    """Create a new organisation. If creator provided, auto-join them as org_admin."""
    org = Organisation(name=name, slug=slug)
    db.add(org)
    try:
        await db.flush() # Get ID without committing yet
        
        if creator and not creator.org_id:
            from app.models.user import UserRole as ModelUserRole
            creator.org_id = org.id
            creator.role = ModelUserRole.org_admin
            logger.info(f"Auto-joining creator {creator.email} to {slug}")

        await db.commit()
        await db.refresh(org)
    except IntegrityError:
        await db.rollback()
        raise ConflictError(f"Organisation slug '{slug}' is already taken")
    logger.info("Organisation created", extra={"org_id": str(org.id), "slug": slug})
    return org


async def get_org(db: AsyncSession, org_id: UUID) -> Organisation:
    """Get a single organisation by ID. Raises NotFoundError."""
    result = await db.execute(
        select(Organisation).where(Organisation.id == org_id)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise NotFoundError(f"Organisation '{org_id}' not found")
    return org


async def list_orgs(
    db: AsyncSession, page: int = 1, page_size: int = 20
) -> tuple[list[Organisation], int]:
    """List all organisations with pagination. Returns (items, total)."""
    # Total count
    count_result = await db.execute(select(func.count(Organisation.id)))
    total = count_result.scalar()

    # Paginated items
    offset = (page - 1) * page_size
    result = await db.execute(
        select(Organisation)
        .order_by(Organisation.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    items = list(result.scalars().all())
    return items, total


async def update_org(
    db: AsyncSession, org_id: UUID, name: str
) -> Organisation:
    """Update an organisation's name. Raises NotFoundError."""
    org = await get_org(db, org_id)
    org.name = name
    try:
        await db.commit()
        await db.refresh(org)
    except IntegrityError:
        await db.rollback()
        raise ConflictError("Failed to update organisation")
    logger.info("Organisation updated", extra={"org_id": str(org_id), "name": name})
    return org


async def delete_org(db: AsyncSession, org_id: UUID) -> None:
    """
    Delete an organisation.
    Raises NotFoundError if org does not exist.
    Raises ConflictError if org has active users.
    """
    org = await get_org(db, org_id)

    # Check for active users
    user_count_result = await db.execute(
        select(func.count(User.id)).where(
            User.org_id == org_id,
            User.is_active == True,
        )
    )
    active_users = user_count_result.scalar()
    if active_users > 0:
        raise ConflictError(
            f"Cannot delete organisation with {active_users} active user(s)"
        )

    await db.delete(org)
    await db.commit()
    logger.info("Organisation deleted", extra={"org_id": str(org_id)})


async def get_org_stats(db: AsyncSession, org_id: UUID) -> dict:
    """Get member_count and active_keys for an organisation."""
    member_result = await db.execute(
        select(func.count(User.id)).where(
            User.org_id == org_id,
            User.is_active == True,
        )
    )
    member_count = member_result.scalar()

    keys_result = await db.execute(
        select(func.count(ApiKey.id)).where(
            ApiKey.org_id == org_id,
            ApiKey.is_active == True,
        )
    )
    active_keys = keys_result.scalar()

    return {"member_count": member_count, "active_keys": active_keys}
