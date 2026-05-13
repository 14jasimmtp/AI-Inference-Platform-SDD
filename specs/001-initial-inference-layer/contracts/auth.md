# Auth Contract

## POST /api/auth/register
Registers a new standalone user.

### Request
```json
{
  "email": "user@example.com",
  "password": "secure_password_123",
  "full_name": "John Doe"
}
```

### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user",
    "created_at": "timestamp"
  }
}
```

## POST /api/auth/login
Authenticates a user and returns a JWT.

### Request
```json
{
  "email": "user@example.com",
  "password": "secure_password_123"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "access_token": "jwt_string",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
      "user_id": "uuid",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```
