# API Keys Contract

## POST /api/api-keys
Creates a new API key for the current user.

### Request
```json
{
  "name": "Production Key",
  "rate_limit_rpm": 60
}
```

### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "key_id": "uuid",
    "name": "Production Key",
    "api_key": "sk-abcdef1234567890", // Shown ONLY once
    "prefix": "sk-abcd",
    "rate_limit_rpm": 60,
    "created_at": "timestamp"
  }
}
```

## GET /api/api-keys
Lists all API keys for the current user.

### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "key_id": "uuid",
      "name": "Production Key",
      "prefix": "sk-abcd",
      "is_active": true,
      "rate_limit_rpm": 60,
      "last_used_at": "timestamp",
      "created_at": "timestamp"
    }
  ]
}
```

## DELETE /api/api-keys/{id}
Revokes an API key.

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "message": "API key revoked successfully"
  }
}
```
