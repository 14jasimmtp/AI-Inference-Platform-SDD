# Quickstart: Phase-2 Multi-tenancy & Admin UI

This document details how to verify the multi-tenancy and RBAC controls implemented in Phase 2.

## RBAC Rules Matrix

The platform enforces 4 explicit roles. `super_admin` has universal access, while `org_admin`, `team_lead`, and `user` are isolated within their `org_id`.

| Action                                | super_admin | org_admin       | team_lead       | user          |
|---------------------------------------|-------------|-----------------|-----------------|---------------|
| Create/Delete Orgs (`POST/DELETE /orgs`) | Yes         | No              | No              | No            |
| View Org Details (`GET /orgs/{id}`)      | All orgs    | Own org only    | No              | No            |
| Invite Users (`POST /orgs/{id}/invite`)  | Yes         | Own org only    | No              | No            |
| Change Roles (`PATCH .../users/{uid}`)   | Yes         | Own org only    | No              | No            |
| View Org Users (`GET .../users`)         | Yes         | Own org only    | Own org only    | No            |
| Create API Key for self (`POST /api-keys`)| Yes         | Yes             | Yes             | Yes           |
| Create API Key for other (`POST /api-keys`)| Yes        | Own org only    | Own org only    | No            |
| List/Revoke API Keys (`GET/DELETE ...`)  | All keys    | Own org keys    | Own org keys    | Own keys only |

## Typical Admin Workflow

### 1. Organisation Creation (Requires super_admin)
```bash
curl -X POST http://localhost:8000/api/v1/orgs \
  -H "Authorization: Bearer <super_admin_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp", "slug": "acme"}'
```

### 2. User Invitation (Requires org_admin or super_admin)
```bash
curl -X POST http://localhost:8000/api/v1/orgs/<acme_org_id>/invite \
  -H "Authorization: Bearer <org_admin_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"email": "bob@acme.com", "role": "team_lead"}'
```

### 3. API Key Generation (Requires user auth)
```bash
curl -X POST http://localhost:8000/api/v1/api-keys \
  -H "Authorization: Bearer <user_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob Prod Key", "rate_limit_rpm": 120}'
```
*Note: The plaintext key `sk-abc1...` is only returned once in this response.*

### 4. API Key Revocation
```bash
curl -X DELETE http://localhost:8000/api/v1/api-keys/<key_id> \
  -H "Authorization: Bearer <org_admin_jwt>"
```

## Security Posture
All cross-organisation requests automatically return `403 Forbidden`. Attempting to assign or invite a `super_admin` returns `422 Unprocessable` or `400 Bad Request`.
