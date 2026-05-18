from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.db.session import get_db
from app.schemas.auth import (
    UserRegisterRequest, 
    UserLoginRequest, 
    TokenResponse, 
    UserResponse,
    GoogleSsoRequest
)
from app.schemas.base import ok
from app.services.auth_service import AuthService
from app.dependencies import get_current_user
from app.models.user import User
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

class EmailCheckRequest(BaseModel):
    email: EmailStr

class UnifiedAuthRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = "New User"

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

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

# --- Feature Phase 3 Extension Routes ---

@router.get("/sso/google", response_model=dict)
async def sso_google():
    """ SSO Redirect helper returning targeted mock login page url """
    return ok({
        "redirect_url": f"{settings.FRONTEND_URL}/mock-google-login"
    })

@router.post("/sso/google/callback", response_model=dict)
async def sso_google_callback(
    body: GoogleSsoRequest,
    db: AsyncSession = Depends(get_db),
):
    """ Handler for both mock and genuine Google SSO callbacks """
    svc = AuthService(db)
    user, token = await svc.sso_google_callback(
        mock_google_token=body.mock_google_token,
        credential_token=body.credential_token,
        email=body.email,
        full_name=body.full_name
    )
    return ok({
        "access_token": token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user).model_dump(),
    })

@router.post("/access", response_model=dict)
async def check_access(
    body: EmailCheckRequest,
    db: AsyncSession = Depends(get_db),
):
    """ Quick check if email already exists in system """
    svc = AuthService(db)
    exists = await svc.check_email_exists(body.email)
    return ok({"exists": exists})

@router.post("/register-login", response_model=dict)
async def register_login_unified(
    body: UnifiedAuthRequest,
    db: AsyncSession = Depends(get_db),
):
    """ Single unified endpoint to log in or register unverified account """
    svc = AuthService(db)
    res = await svc.register_login_unified(
        email=body.email,
        password=body.password,
        full_name=body.full_name or "New User"
    )
    if res["action"] == "login":
        return ok({
            "action": "login",
            "access_token": res["token"],
            "token_type": "bearer",
            "user": UserResponse.model_validate(res["user"]).model_dump()
        })
    else:
        return ok({
            "action": "register",
            "is_verified": False,
            "message": "Verification link has been sent to your email."
        })

@router.get("/verify", response_model=dict)
async def verify_email(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """ URL verification token callback handler """
    svc = AuthService(db)
    user, session_token = await svc.verify_email_token(token)
    return ok({
        "access_token": session_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user).model_dump()
    })

@router.post("/forgot-password", response_model=dict)
async def forgot_password(
    body: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """ Requests a reset password link to be dispatched """
    svc = AuthService(db)
    await svc.forgot_password_request(body.email)
    return ok({"message": "Password recovery email has been sent if registered."})

@router.post("/reset-password", response_model=dict)
async def reset_password(
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """ Updates credentials after consuming reset token """
    svc = AuthService(db)
    await svc.reset_password_consume(body.token, body.new_password)
    return ok({"message": "Password updated successfully."})
