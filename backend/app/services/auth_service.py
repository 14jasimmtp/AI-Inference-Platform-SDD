import logging
import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.schemas.auth import UserRegisterRequest
from app.core.auth import get_password_hash, verify_password, create_access_token, generate_secure_token
from app.exceptions import ConflictError, UnauthorizedError, NotFoundError
from app.services.email_service import EmailService

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
            is_verified=True, # Standard old registration path remains verified by default
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
            raise NotFoundError("User not found")
        return user

    # --- Feature Phase 3 Extensions ---

    async def check_email_exists(self, email: str) -> bool:
        """ Checks if email is registered """
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none() is not None

    async def sso_google_callback(
        self,
        mock_google_token: Optional[str] = None,
        credential_token: Optional[str] = None,
        email: Optional[str] = None,
        full_name: Optional[str] = None
    ) -> tuple[User, str]:
        """ Handles both simulated and genuine Google Sign-On validation """
        google_sso_id = None
        user_email = email
        user_fullname = full_name

        if credential_token:
            # Real Google Identity validation using standard Google TokenInfo API
            import httpx
            from app.config import settings
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                try:
                    response = await client.get(
                        "https://oauth2.googleapis.com/tokeninfo",
                        params={"id_token": credential_token}
                    )
                except Exception as e:
                    logger.error(f"Failed to reach Google TokenInfo API: {str(e)}")
                    raise UnauthorizedError("Google authentication service is temporarily unavailable")
                
                if response.status_code != 200:
                    logger.error(f"Google TokenInfo verification failed: {response.text}")
                    raise UnauthorizedError("Invalid or expired Google credential token")
                
                info = response.json()
                google_sso_id = info.get("sub")
                user_email = info.get("email")
                user_fullname = info.get("name") or info.get("given_name", "Google User")
                
                if not google_sso_id or not user_email:
                    raise UnauthorizedError("Failed to extract account details from Google response")
                
                # Optional Audience ID check if configured in environment settings
                if settings.GOOGLE_CLIENT_ID:
                    aud = info.get("aud")
                    if aud != settings.GOOGLE_CLIENT_ID:
                        logger.error(f"Google client ID mismatch: aud={aud}, expected={settings.GOOGLE_CLIENT_ID}")
                        raise UnauthorizedError("Google Client ID audience validation failed")
        else:
            # Fallback to simulated offline development flow
            if not mock_google_token:
                raise UnauthorizedError("No Google SSO credential provided")
            google_sso_id = mock_google_token
            user_email = email or f"{mock_google_token}@gmail.com"
            user_fullname = full_name or f"Google User {mock_google_token[:6]}"

        # Look up by google_sso_id or email
        result = await self.db.execute(
            select(User).where(
                (User.google_sso_id == google_sso_id) | (User.email == user_email)
            )
        )
        user = result.scalar_one_or_none()

        if user:
            # Update google_sso_id if not linked
            if not user.google_sso_id:
                user.google_sso_id = google_sso_id
            user.is_verified = True
            await self.db.commit()
            await self.db.refresh(user)
        else:
            # Create a new verified user via Google SSO
            placeholder_pass = generate_secure_token()
            user = User(
                email=user_email,
                full_name=user_fullname,
                password_hash=get_password_hash(placeholder_pass),
                google_sso_id=google_sso_id,
                is_verified=True,
            )
            self.db.add(user)
            await self.db.commit()
            await self.db.refresh(user)
            logger.info("New User registered via Google SSO", extra={"user_id": str(user.id)})

        token = create_access_token(subject=str(user.id))
        return user, token

    async def register_login_unified(self, email: str, password: str, full_name: str = "New User") -> dict:
        """ Performs registration (if new) or login (if existing) dynamically """
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user:
            # Perform standard login validation
            if not verify_password(password, user.password_hash):
                raise UnauthorizedError("Invalid credentials")
            if not user.is_active:
                raise UnauthorizedError("Account is deactivated")
            
            token = create_access_token(subject=str(user.id))
            logger.info("Unified user login complete", extra={"user_id": str(user.id)})
            return {
                "action": "login",
                "user": user,
                "token": token
            }
        else:
            # Register a new unverified user
            verification_token = generate_secure_token()
            user = User(
                email=email,
                full_name=full_name,
                password_hash=get_password_hash(password),
                is_verified=False,
                verification_token=verification_token,
                verification_sent_at=datetime.datetime.now(datetime.timezone.utc),
            )
            self.db.add(user)
            await self.db.commit()
            await self.db.refresh(user)
            
            # Send verification link to Mailpit asynchronously
            await EmailService.send_verification_email(email, verification_token)
            logger.info("Unified user registration complete", extra={"user_id": str(user.id)})
            return {
                "action": "register",
                "user": user,
                "token": None
            }

    async def verify_email_token(self, token: str) -> tuple[User, str]:
        """ Validates verification token, marks user verified, and returns session """
        result = await self.db.execute(
            select(User).where(User.verification_token == token)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise UnauthorizedError("Invalid or consumed verification token")

        # Expiry Check (24 hours)
        now = datetime.datetime.now(datetime.timezone.utc)
        if user.verification_sent_at and (now - user.verification_sent_at.replace(tzinfo=datetime.timezone.utc)) > datetime.timedelta(hours=24):
            raise UnauthorizedError("Verification token has expired")

        # Mark verified and clear tokens
        user.is_verified = True
        user.verification_token = None
        user.verification_sent_at = None
        await self.db.commit()
        await self.db.refresh(user)

        # Issue login session immediately
        session_token = create_access_token(subject=str(user.id))
        logger.info("User verified account and logged in", extra={"user_id": str(user.id)})
        return user, session_token

    async def forgot_password_request(self, email: str) -> None:
        """ Triggers recovery token creation and sends password recovery email """
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            # Secure design: do not leak user existence. Return success silently.
            logger.warning(f"Password recovery requested for non-existent email: {email}")
            return

        reset_token = generate_secure_token()
        user.reset_token = reset_token
        user.reset_expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)
        await self.db.commit()

        # Send recovery email to Mailpit asynchronously
        await EmailService.send_recovery_email(email, reset_token)
        logger.info("Password recovery link dispatched", extra={"user_id": str(user.id)})

    async def reset_password_consume(self, token: str, new_password: str) -> None:
        """ Validates recovery token and updates credentials """
        result = await self.db.execute(select(User).where(User.reset_token == token))
        user = result.scalar_one_or_none()

        if not user:
            raise UnauthorizedError("Invalid or consumed password recovery token")

        # Expiry Check (1 hour)
        now = datetime.datetime.now(datetime.timezone.utc)
        if user.reset_expires_at and now > user.reset_expires_at.replace(tzinfo=datetime.timezone.utc):
            raise UnauthorizedError("Password recovery token has expired")

        # Update credentials and clear tokens
        user.password_hash = get_password_hash(new_password)
        user.reset_token = None
        user.reset_expires_at = None
        await self.db.commit()
        logger.info("Password updated successfully via token recovery", extra={"user_id": str(user.id)})
