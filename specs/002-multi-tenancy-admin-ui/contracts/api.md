# API Contracts: Phase-2 Multi-tenancy & Admin UI

This document summarises the JSON request and response payloads defined in Phase 2. All responses (except standard streaming responses) are wrapped in the standard envelope: `{ "success": true, "data": {...} }`.

## Schemas

### OrgCreateRequest (POST /orgs)
```json
{
  "name": "Acme Corp",
  "slug": "acme"
}
```

### OrgResponse
```json
{
  "org_id": "uuid",
  "name": "Acme Corp",
  "slug": "acme",
  "is_active": true,
  "created_at": "2026-05-14T00:00:00Z",
  "updated_at": "2026-05-14T00:00:00Z"
}
```

### InviteUserRequest (POST /orgs/{id}/invite)
```json
{
  "email": "user@example.com",
  "role": "team_lead"
}
```

### ApiKeyCreateRequest (POST /api-keys)
```json
{
  "name": "My key",
  "user_id": "uuid-optional",
  "rate_limit_rpm": 60,
  "expires_at": "2026-12-31T23:59:59Z"
}
```

### ApiKeyCreatedResponse
```json
{
  "key_id": "uuid",
  "name": "My key",
  "api_key": "sk-abc1234567890abcdef", 
  "prefix": "sk-abc1",
  "user_id": "uuid",
  "org_id": "uuid",
  "rate_limit_rpm": 60,
  "created_at": "2026-05-14T00:00:00Z",
  "expires_at": "2026-12-31T23:59:59Z"
}
```
*Note: `api_key` is only returned once upon creation or rotation.*
