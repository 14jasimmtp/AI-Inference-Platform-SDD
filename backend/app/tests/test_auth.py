import unittest
import uuid
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.services.auth_service import AuthService

class TestAuth(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_check_access_existing_email(self):
        """ Tests that /auth/access returns exists: True for registered emails """
        with patch.object(AuthService, 'check_email_exists', new_callable=AsyncMock) as mock_check:
            mock_check.return_value = True
            response = self.client.post("/api/v1/auth/access", json={"email": "exists@acme.com"})
            self.assertEqual(response.status_code, 200)
            self.assertTrue(response.json()["data"]["exists"])
            mock_check.assert_called_once_with("exists@acme.com")

    def test_check_access_new_email(self):
        """ Tests that /auth/access returns exists: False for unregistered emails """
        with patch.object(AuthService, 'check_email_exists', new_callable=AsyncMock) as mock_check:
            mock_check.return_value = False
            response = self.client.post("/api/v1/auth/access", json={"email": "new@acme.com"})
            self.assertEqual(response.status_code, 200)
            self.assertFalse(response.json()["data"]["exists"])
            mock_check.assert_called_once_with("new@acme.com")

    @patch.object(AuthService, 'register_login_unified', new_callable=AsyncMock)
    def test_register_login_unified_login(self, mock_service):
        """ Tests that /auth/register-login successfully returns a login session """
        mock_user = MagicMock()
        mock_user.id = uuid.UUID("61fce899-5de3-4d24-8bfd-f44e61b2ac72")
        mock_user.email = "user@acme.com"
        mock_user.full_name = "Muhamed Jasim"
        mock_user.role = "user"
        mock_user.org_id = None
        mock_user.is_active = True
        
        mock_service.return_value = {
            "action": "login",
            "user": mock_user,
            "token": "mock-jwt-token"
        }
        
        response = self.client.post(
            "/api/v1/auth/register-login", 
            json={"email": "user@acme.com", "password": "securepassword", "full_name": "Muhamed Jasim"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["action"], "login")
        self.assertEqual(data["access_token"], "mock-jwt-token")
        self.assertEqual(data["user"]["email"], "user@acme.com")

    @patch.object(AuthService, 'verify_email_token', new_callable=AsyncMock)
    def test_verify_email_success(self, mock_verify):
        """ Tests that /auth/verify activates user and logs them in """
        mock_user = MagicMock()
        mock_user.id = uuid.UUID("61fce899-5de3-4d24-8bfd-f44e61b2ac72")
        mock_user.email = "verified@acme.com"
        mock_user.full_name = "Verified User"
        mock_user.role = "user"
        mock_user.org_id = None
        mock_user.is_active = True
        
        mock_verify.return_value = (mock_user, "session-access-token")
        
        response = self.client.get("/api/v1/auth/verify?token=cryptotoken")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["access_token"], "session-access-token")
        self.assertEqual(data["user"]["email"], "verified@acme.com")

    @patch.object(AuthService, 'sso_google_callback', new_callable=AsyncMock)
    def test_sso_google_callback_mock(self, mock_sso):
        """ Tests that /auth/sso/google/callback processes mock tokens successfully """
        mock_user = MagicMock()
        mock_user.id = uuid.UUID("61fce899-5de3-4d24-8bfd-f44e61b2ac72")
        mock_user.email = "google-user@gmail.com"
        mock_user.full_name = "Google User"
        mock_user.role = "user"
        mock_user.org_id = None
        mock_user.is_active = True
        
        mock_sso.return_value = (mock_user, "google-session-token")
        
        response = self.client.post(
            "/api/v1/auth/sso/google/callback",
            json={"mock_google_token": "dev-token-123"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["access_token"], "google-session-token")
        self.assertEqual(data["user"]["email"], "google-user@gmail.com")

if __name__ == '__main__':
    unittest.main()
