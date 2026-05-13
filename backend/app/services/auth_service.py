import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.schemas.auth import UserRegisterRequest
from app.core.auth import get_password_hash, verify_password, create_access_token
from app.exceptions import ConflictError, UnauthorizedError

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, request: UserRegisterRequest) -> User:
        # Check if email already exists
        result = await self.db.execute(
            select(User).where(User.email == request.email)
        )
        existing_user = result.scalar_one_or_none()
        if existing_user:
            raise ConflictError(f"User with email '{request.email}' already exists")

        user = User(
            email=request.email,
            full_name=request.full_name,
            password_hash=get_password_hash(request.password),
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        logger.info("User registered", extra={"user_id": str(user.id)})
        return user

    async def login(self, email: str, password: str) -> tuple[User, str]:
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user or not verify_password(password, user.password_hash):
            raise UnauthorizedError("Invalid email or password")

        if not user.is_active:
            raise UnauthorizedError("Account is deactivated")

        token = create_access_token(subject=str(user.id))
        logger.info("User logged in", extra={"user_id": str(user.id)})
        return user, token

    async def get_user_by_id(self, user_id: str) -> User:
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            from app.exceptions import NotFoundError
            raise NotFoundError("User not found")
        return user
