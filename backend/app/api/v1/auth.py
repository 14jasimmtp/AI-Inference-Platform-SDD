from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse
from app.schemas.base import ok
from app.services.auth_service import AuthService
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=dict, status_code=201)
async def register(
    body: UserRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    svc = AuthService(db)
    user = await svc.register(body)
    return ok(UserResponse.model_validate(user).model_dump())

@router.post("/login", response_model=dict)
async def login(
    body: UserLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    svc = AuthService(db)
    user, token = await svc.login(body.email, body.password)
    return ok({
        "access_token": token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user).model_dump(),
    })

@router.get("/me", response_model=dict)
async def me(current_user: User = Depends(get_current_user)):
    return ok(UserResponse.model_validate(current_user).model_dump())

@router.get("/rate-limit", response_model=dict)
async def get_rate_limit(current_user: User = Depends(get_current_user)):
    from app.core.rate_limiter import rate_limiter
    from app.config import settings
    limit_info = await rate_limiter.peek_rate_limit(str(current_user.id), settings.DEFAULT_RATE_LIMIT_RPM)
    return ok(limit_info)
