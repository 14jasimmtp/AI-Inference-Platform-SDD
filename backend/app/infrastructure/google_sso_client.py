import httpx
import logging
from typing import Dict, Any
from app.config import settings
from app.core.exceptions import UnauthorizedError

logger = logging.getLogger(__name__)

class GoogleSSOClient:
    """
    Client for interacting with Google's OAuth2/SSO APIs.
    """
    
    @staticmethod
    async def verify_id_token(credential_token: str) -> Dict[str, Any]:
        """
        Verifies a Google ID token using Google's TokenInfo API and returns the user payload.
        """
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
            
            # Audience ID check
            if not settings.GOOGLE_CLIENT_ID:
                raise UnauthorizedError("Google SSO is disabled (missing Client ID)")
            
            aud = info.get("aud")
            if aud != settings.GOOGLE_CLIENT_ID:
                logger.error(f"Google client ID mismatch: aud={aud}, expected={settings.GOOGLE_CLIENT_ID}")
                raise UnauthorizedError("Google Client ID audience validation failed")
                
            return info
