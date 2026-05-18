# Quickstart Guide: Unified Authentication

This guide documents the API routes, integration endpoints, and setup processes required to test the unified registration, verification, and password reset flows locally.

---

## 1. Local SMTP Sandbox: Mailpit Integration

To test verification and recovery emails without external internet access or credentials, Feature Phase 3 adds Mailpit to the local developer runtime.

### Docker Compose configuration (`docker-compose.yml` snippet)

```yaml
services:
  mailpit:
    image: axllent/mailpit:latest
    container_name: mailpit-smtp-sandbox
    ports:
      - "1025:1025"   # SMTP Port
      - "8025:8025"   # Web UI Port
    networks:
      - platform-network
```

* **SMTP Host**: `mailpit` (inside Docker network), `localhost` (from host machine)
* **SMTP Port**: `1025`
* **Web UI URL**: `http://localhost:8025`

---

## 2. API Reference & Extended Authentication Routes

All authentication endpoints return standardized response envelopes:

### Unified Login & Registration Flow
* **POST `/api/v1/auth/access`**
  * *Purpose*: A single entry endpoint that checks if the submitted email exists.
  * *Request*:
    ```json
    { "email": "developer@acme.com" }
    ```
  * *200 Response (Existing User)*:
    ```json
    { "success": true, "data": { "exists": true, "message": "Email registered. Please provide your password." } }
    ```
  * *200 Response (New User)*:
    ```json
    { "success": true, "data": { "exists": false, "message": "Email not registered. Proceed to set your password and register." } }
    ```

* **POST `/api/v1/auth/register-login`**
  * *Purpose*: Performs registration (if new) or login (if existing) depending on account existence.
  * *Request*:
    ```json
    { "email": "developer@acme.com", "password": "Str0ngPass!Word", "full_name": "Dev User" }
    ```
  * *201 Response (New Account - Unverified)*:
    ```json
    { "success": true, "data": { "user_id": "usr_abc123", "is_verified": false, "message": "Account created. A verification email has been dispatched." } }
    ```
  * *200 Response (Existing Account)*:
    ```json
    {
      "success": true,
      "data": {
        "access_token": "eyJhbGci...",
        "token_type": "bearer",
        "user": { "user_id": "usr_abc123", "role": "user", "org_id": "org_xyz789" }
      }
    }
    ```

---

### Email Verification & Auto-Login
* **GET `/api/v1/auth/verify?token=<verification-token>`**
  * *Purpose*: Validates the verification token. If valid, marks the user verified, logs them in automatically, and returns full session JWT tokens.
  * *200 Response (Verification Success & Instant Login)*:
    ```json
    {
      "success": true,
      "data": {
        "access_token": "eyJhbGci...",
        "token_type": "bearer",
        "user": { "user_id": "usr_abc123", "role": "user", "org_id": "org_xyz789" }
      }
    }
    ```

---

### Mock Google SSO Simulation
* **GET `/api/v1/auth/sso/google`**
  * *Purpose*: Redirects the client to the simulated local SSO consent portal.
* **POST `/api/v1/auth/sso/google/callback`**
  * *Purpose*: Handles mock OAuth tokens, registers or logs the user in, marks them verified instantly, and issues their stateless JWT session tokens.
  * *Request*:
    ```json
    { "mock_google_token": "mock-sub-123456" }
    ```
  * *200 Response (SSO Login & Instant Redirect)*:
    ```json
    {
      "success": true,
      "data": {
        "access_token": "eyJhbGci...",
        "token_type": "bearer",
        "user": { "user_id": "usr_abc123", "role": "user", "org_id": "org_xyz789" }
      }
    }
    ```

---

### Forgot Password & Recovery
* **POST `/api/v1/auth/forgot-password`**
  * *Request*:
    ```json
    { "email": "developer@acme.com" }
    ```
  * *200 Response*:
    ```json
    { "success": true, "data": { "message": "If the email is registered, a password recovery link has been sent." } }
    ```

* **POST `/api/v1/auth/reset-password`**
  * *Request*:
    ```json
    { "token": "recovery-token-uuid", "new_password": "N3wStr0ng!Pass" }
    ```
  * *200 Response*:
    ```json
    { "success": true, "data": { "message": "Password successfully updated. Please log in." } }
    ```
