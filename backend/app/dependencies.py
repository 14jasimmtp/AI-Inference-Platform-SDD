import logging
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError
from app.db.session import get_db
from app.config import settings
from app.exceptions import UnauthorizedError
from app.models.user import User
from app.models.api_key import ApiKey
from sqlalchemy import select

logger = logging.getLogger(__name__)
bearer_scheme = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Authenticate via JWT Bearer token."""
    if not credentials:
        raise UnauthorizedError("Missing authorization header")
    
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if not user_id:
            raise UnauthorizedError("Invalid token payload")
    except JWTError:
        raise UnauthorizedError("Invalid or expired token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise UnauthorizedError("User not found or deactivated")
    return user

async def get_api_key_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> tuple[User, ApiKey]:
    """Authenticate via API key. Returns (user, api_key) or raises UnauthorizedError."""
    from app.services.api_key_service import ApiKeyService
    from app.core.auth import hash_api_key

    if not credentials:
        raise UnauthorizedError("Missing authorization header")

    raw_key = credentials.credentials
    # Try JWT first, then API key
    try:
        payload = jwt.decode(
            raw_key, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if user and user.is_active:
                return user, None  # JWT-based auth, no API key
    except JWTError:
        pass  # Try API key

    svc = ApiKeyService(db)
    api_key = await svc.authenticate_by_key(raw_key, db)
    result = await db.execute(select(User).where(User.id == api_key.user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise UnauthorizedError("Associated user not found or deactivated")
    return user, api_key
