import secrets
import logging
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.api_key import ApiKey
from app.schemas.api_key import ApiKeyCreateRequest
from app.core.auth import hash_api_key
from app.exceptions import NotFoundError, ForbiddenError

logger = logging.getLogger(__name__)

KEY_PREFIX_LEN = 7  # store first 7 chars for identification

class ApiKeyService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _generate_raw_key(self) -> str:
        return f"sk-{secrets.token_urlsafe(32)}"

    async def create_key(self, user_id: str, request: ApiKeyCreateRequest) -> tuple[ApiKey, str]:
        raw_key = self._generate_raw_key()
        key_hash = hash_api_key(raw_key)
        key_prefix = raw_key[:KEY_PREFIX_LEN]

        api_key = ApiKey(
            user_id=user_id,
            name=request.name,
            key_hash=key_hash,
            key_prefix=key_prefix,
            rate_limit_rpm=request.rate_limit_rpm,
        )
        self.db.add(api_key)
        await self.db.commit()
        await self.db.refresh(api_key)
        logger.info("API key created", extra={"key_id": str(api_key.id), "user_id": str(user_id)})
        # Return the model AND the plaintext key (shown ONCE)
        return api_key, raw_key

    async def list_keys(self, user_id: str) -> list[ApiKey]:
        result = await self.db.execute(
            select(ApiKey)
            .where(ApiKey.user_id == user_id)
            .where(ApiKey.is_active == True)
            .order_by(ApiKey.created_at.desc())
        )
        return list(result.scalars().all())

    async def revoke_key(self, key_id: str, user_id: str) -> None:
        result = await self.db.execute(
            select(ApiKey).where(ApiKey.id == key_id)
        )
        api_key = result.scalar_one_or_none()
        if not api_key:
            raise NotFoundError("API key not found")
        if str(api_key.user_id) != user_id:
            raise ForbiddenError("Not authorized to revoke this key")

        api_key.is_active = False
        api_key.revoked_at = datetime.now(timezone.utc)
        await self.db.commit()
        logger.info("API key revoked", extra={"key_id": key_id, "user_id": user_id})

    async def authenticate_by_key(self, raw_key: str, db: AsyncSession) -> ApiKey:
        """Validate raw API key. Returns the ApiKey object or raises UnauthorizedError."""
        from app.exceptions import UnauthorizedError
        key_hash = hash_api_key(raw_key)
        result = await db.execute(
            select(ApiKey).where(
                ApiKey.key_hash == key_hash,
                ApiKey.is_active == True,
            )
        )
        api_key = result.scalar_one_or_none()
        if not api_key:
            raise UnauthorizedError("Invalid or revoked API key")

        # Update last_used_at
        api_key.last_used_at = datetime.now(timezone.utc)
        await db.commit()
        return api_key
