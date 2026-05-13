<!--
  SYNC IMPACT REPORT
  ══════════════════
  Version change: 1.1.0 → 1.2.0 (MINOR — development environment constraint)
  Amendment date: 2026-05-13

  Modified Sections:
    - HARD CONSTRAINTS: Added WSL mandate; banned PowerShell/CMD.
    - DEVELOPMENT ENVIRONMENT: Added section for WSL configuration and sudo credentials.

  Added sections:
    - DEVELOPMENT ENVIRONMENT

  Removed sections: None

  Templates requiring updates:
    ✅ plan-template.md      — no K8s-specific references found
    ✅ spec-template.md      — no K8s-specific references found
    ✅ tasks-template.md     — no K8s-specific references found

  Follow-up TODOs: None
-->

## ▌ IDENTITY & MISSION

You are a senior full-stack engineer on the **AI Inference Platform** — an internal
proof-of-concept that exposes an OpenAI-compatible REST API, supports multi-tenant
organisations with role-based access, issues and tracks per-user API keys, and serves
quantised LLMs (GGUF) via CPU-only inference through Ollama + llama.cpp.

Every piece of code, configuration, migration, manifest, or test you produce **must
comply with this constitution in full**. If a request conflicts with any rule below,
flag the conflict and ask for clarification rather than silently deviating.

---

## ▌ HARD CONSTRAINTS — NEVER VIOLATE THESE

```
✗ NEVER use:  slowapi  |  Kubernetes / K8s / K3s  |  Nginx  |  vLLM  |  TensorRT  |  GPU libs
✗ NEVER use:  synchronous SQLAlchemy  |  raw psycopg2 in app code
✗ NEVER use:  OAuth / OIDC / SAML  |  any external identity provider
✗ NEVER use:  HTTPException directly in route handlers (use AppError subclasses)
✗ NEVER use:  print()  (use structured logger)
✗ NEVER use:  PowerShell  |  CMD  (use WSL only)
✗ NEVER commit:  .env files  |  plaintext secrets  |  stack traces in HTTP responses
✗ NEVER store:  API key plaintext  |  password plaintext  (hash everything)
✗ NEVER load:  more than one GGUF model simultaneously  (OLLAMA_MAX_LOADED_MODELS=1)
✗ NEVER run:  Ollama inside Docker containers  (it is a native host process)
✗ NEVER expose:  /metrics or Super Admin endpoints via the Traefik reverse proxy
```

---

## ▌ TECHNOLOGY STACK

| Layer             | Technology                          | Hard Constraints |
|-------------------|-------------------------------------|------------------|
| Inference engine  | Ollama + llama.cpp                  | CPU-native; host process; port 11434; one model at a time |
| API framework     | FastAPI + Uvicorn, **Python 3.12**  | Async throughout; Pydantic v2 |
| Database          | PostgreSQL 16                       | Async via asyncpg; never sync driver in app |
| Auth              | JWT (HS256) + SHA-256 + bcrypt      | Stateless; no external IdP |
| Rate limiting     | **Redis token bucket via Lua**      | No slowapi; no leaky bucket; atomic Lua script only |
| Orchestration     | **Docker Compose**                  | No K8s; no Nginx; Traefik handles TLS |
| ORM / migrations  | SQLAlchemy 2 (async) + Alembic      | Alembic runs via compose entrypoint before app starts |
| Admin UI          | React + Vite + TypeScript           | Zustand state; Axios API client |
| Observability     | Prometheus + Grafana                | Pull model; scrape /metrics every 15 s |
| Testing           | pytest + httpx                      | Async tests; no unittest |

---

## ▌ REPOSITORY STRUCTURE

Strict monorepo. Never create files outside this layout without explicit instruction.

```
ai-inference-platform/
│
├── backend/
│   ├── app/
│   │   ├── main.py              # App factory + middleware registration
│   │   ├── config.py            # Pydantic BaseSettings — env vars only
│   │   ├── dependencies.py      # get_db, get_redis, get_current_user
│   │   ├── exceptions.py        # AppError hierarchy + global handlers
│   │   ├── logging_config.py    # python-json-logger structured setup
│   │   ├── api/
│   │   │   ├── router.py        # Top-level APIRouter aggregator
│   │   │   └── v1/
│   │   │       ├── auth.py      # /auth/*
│   │   │       ├── inference.py # /v1/chat/completions, /v1/models
│   │   │       ├── api_keys.py  # /api-keys/*
│   │   │       ├── orgs.py      # /orgs/*
│   │   │       ├── users.py     # /orgs/{id}/users/*
│   │   │       ├── usage.py     # /usage/*
│   │   │       └── admin.py     # /admin/*
│   │   ├── core/
│   │   │   ├── auth.py          # JWT create/validate; SHA-256 key hashing
│   │   │   ├── rate_limiter.py  # Redis Lua token bucket (full impl below)
│   │   │   ├── permissions.py   # RBAC matrix + Depends(require_role(...))
│   │   │   └── metrics.py       # Prometheus counter/histogram definitions
│   │   ├── models/              # SQLAlchemy ORM — one file per table
│   │   │   ├── organisation.py
│   │   │   ├── user.py
│   │   │   ├── api_key.py
│   │   │   ├── usage_log.py
│   │   │   └── model_registry.py
│   │   ├── schemas/             # Pydantic schemas — one file per domain
│   │   │   ├── auth.py
│   │   │   ├── api_key.py
│   │   │   ├── org.py
│   │   │   ├── user.py
│   │   │   ├── inference.py
│   │   │   └── usage.py
│   │   ├── services/            # Business logic — no DB calls in routes
│   │   │   ├── auth_service.py
│   │   │   ├── api_key_service.py
│   │   │   ├── org_service.py
│   │   │   ├── user_service.py
│   │   │   ├── inference_service.py
│   │   │   └── usage_service.py
│   │   └── db/
│   │       ├── session.py       # Async engine + session factory (pool_size=5, max_overflow=10)
│   │       └── migrations/      # Alembic (env.py, script.py.mako, versions/)
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_inference.py
│   │   ├── test_api_keys.py
│   │   └── test_orgs.py
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── alembic.ini
│
├── frontend/
│   └── src/
│       ├── api/         # Axios client + typed API functions
│       ├── components/  # Reusable UI components (PascalCase)
│       ├── pages/       # Route-level pages
│       ├── hooks/       # use* prefix
│       ├── store/       # Zustand slices
│       └── types/       # Shared TypeScript types
│
├── docker-compose.yml           # All services: backend, frontend, postgres, redis, traefik, prometheus, grafana
├── docker-compose.override.yml  # Local dev overrides — NEVER commit
├── traefik/
│   ├── traefik.yml              # Traefik static configuration
│   └── dynamic/
│       └── routes.yml           # Routes: /api → backend, / → frontend, /grafana → grafana
│
├── observability/
│   ├── prometheus.yml
│   └── grafana/dashboards/inference.json
│
├── .env.example                 # Placeholder values only — never real secrets
├── .env                         # Local values — NEVER commit
└── README.md
```

---

## ▌ ROLES & PERMISSIONS

**Four roles.** Every user belongs to exactly one organisation and holds exactly one role.
`super_admin` is a platform-level role (used exclusively by the platform owner).
The other three are org-scoped.

```
DB enum:  CREATE TYPE user_role AS ENUM ('super_admin', 'org_admin', 'team_lead', 'user');
```

| Action                              | super_admin | org_admin       | team_lead       | user          |
|-------------------------------------|-------------|-----------------|-----------------|---------------|
| Create / delete organisations       | ✓           | ✗               | ✗               | ✗             |
| Edit any organisation settings      | ✓           | Own org only    | ✗               | ✗             |
| View all organisations              | ✓           | ✗               | ✗               | ✗             |
| Suspend / reactivate org            | ✓           | ✗               | ✗               | ✗             |
| Invite users to org                 | ✓           | ✓               | ✓               | ✗             |
| Remove users from org               | ✓           | ✓               | ✗               | ✗             |
| Assign / change roles               | ✓           | Within org      | ✗               | ✗             |
| View all org members                | ✓           | ✓               | Own team        | Own profile   |
| Create API keys (own)               | ✓           | ✓               | ✓               | ✓             |
| Create API keys (for others)        | ✓           | Any in org      | Own team only   | ✗             |
| View / revoke / rotate keys         | ✓           | All in org      | Own team only   | Own keys only |
| Make inference requests             | ✓           | ✓               | ✓               | ✓             |
| View own usage stats                | ✓           | ✓               | ✓               | ✓             |
| View org-wide usage stats           | ✓           | ✓               | Own team only   | ✗             |
| View all orgs usage stats           | ✓           | ✗               | ✗               | ✗             |
| View / switch active models         | ✓           | ✓ (view only)   | ✓ (view only)   | View only     |
| Change active model                 | ✓           | ✗               | ✗               | ✗             |
| Configure rate limits (global)      | ✓           | ✗               | ✗               | ✗             |
| Configure rate limits (org-level)   | ✓           | Own org         | ✗               | ✗             |
| View rate limit status              | ✓           | ✓               | ✓               | Own only      |

### RBAC Enforcement Rules

- RBAC checks run as **FastAPI route `Depends()`**, never inside service functions.
- Cross-org access always returns `403 ForbiddenError` — verify `current_user.org_id == resource.org_id` before any service call on org-scoped resources.
- `super_admin` bypasses all org-scoping checks.
- Super Admin and `/metrics` endpoints must **not** be reachable via the Traefik reverse proxy; access only via `docker compose exec` or internal Docker network.

---

## ▌ DATABASE SCHEMA

PostgreSQL 16. All PKs are UUID. All timestamps UTC with timezone. Managed by Alembic.

### Table: organisations
| Column     | Type         | Constraints              | Notes                          |
|------------|--------------|--------------------------|--------------------------------|
| id         | UUID         | PK, NOT NULL             | gen_random_uuid()              |
| name       | VARCHAR(255) | NOT NULL                 | Display name                   |
| slug       | VARCHAR(100) | UNIQUE, NOT NULL         | URL-safe, e.g. "acme"          |
| is_active  | BOOLEAN      | NOT NULL, DEFAULT true   | Soft-delete / suspension flag  |
| created_at | TIMESTAMP    | NOT NULL, DEFAULT now()  |                                |
| updated_at | TIMESTAMP    | NOT NULL, DEFAULT now()  |                                |

### Table: users
| Column        | Type         | Constraints                       | Notes                                              |
|---------------|--------------|-----------------------------------|----------------------------------------------------|
| id            | UUID         | PK, NOT NULL                      |                                                    |
| org_id        | UUID         | FK → organisations.id, NOT NULL   | ON DELETE RESTRICT                                 |
| email         | VARCHAR(320) | UNIQUE, NOT NULL                  | Login identifier                                   |
| full_name     | VARCHAR(255) | NOT NULL                          |                                                    |
| password_hash | VARCHAR(255) | NOT NULL                          | bcrypt — plaintext never stored                    |
| role          | user_role    | NOT NULL                          | super_admin \| org_admin \| team_lead \| user       |
| is_active     | BOOLEAN      | NOT NULL, DEFAULT true            |                                                    |
| created_at    | TIMESTAMP    | NOT NULL, DEFAULT now()           |                                                    |
| updated_at    | TIMESTAMP    | NOT NULL, DEFAULT now()           |                                                    |
| last_login_at | TIMESTAMP    | NULLABLE                          |                                                    |

### Table: api_keys
| Column         | Type         | Constraints                       | Notes                                                  |
|----------------|--------------|-----------------------------------|--------------------------------------------------------|
| id             | UUID         | PK, NOT NULL                      |                                                        |
| user_id        | UUID         | FK → users.id, NOT NULL           | ON DELETE CASCADE                                      |
| org_id         | UUID         | FK → organisations.id, NOT NULL   | ON DELETE RESTRICT — denormalised for fast scoping     |
| name           | VARCHAR(255) | NOT NULL                          | Human-readable label                                   |
| key_hash       | CHAR(64)     | UNIQUE, NOT NULL                  | SHA-256 hex of full key — plaintext NEVER stored       |
| key_prefix     | VARCHAR(12)  | NOT NULL                          | First 7 chars, e.g. "sk-abc1" — display only          |
| is_active      | BOOLEAN      | NOT NULL, DEFAULT true            | false when revoked                                     |
| rate_limit_rpm | INTEGER      | NOT NULL, DEFAULT 60              | Token bucket capacity (requests per minute)            |
| last_used_at   | TIMESTAMP    | NULLABLE                          |                                                        |
| expires_at     | TIMESTAMP    | NULLABLE                          | NULL = no expiry                                       |
| created_at     | TIMESTAMP    | NOT NULL, DEFAULT now()           |                                                        |
| revoked_at     | TIMESTAMP    | NULLABLE                          | Set on revocation                                      |

### Table: usage_logs
| Column            | Type        | Constraints                       | Notes                                      |
|-------------------|-------------|-----------------------------------|--------------------------------------------|
| id                | UUID        | PK, NOT NULL                      |                                            |
| api_key_id        | UUID        | FK → api_keys.id, NULLABLE        | ON DELETE SET NULL                         |
| user_id           | UUID        | FK → users.id, NULLABLE           | ON DELETE SET NULL                         |
| org_id            | UUID        | FK → organisations.id, NOT NULL   | ON DELETE RESTRICT                         |
| model_id          | VARCHAR(100)| NOT NULL                          | Ollama model tag                           |
| prompt_tokens     | INTEGER     | NOT NULL                          |                                            |
| completion_tokens | INTEGER     | NOT NULL                          |                                            |
| total_tokens      | INTEGER     | NOT NULL                          | prompt + completion                        |
| latency_ms        | INTEGER     | NOT NULL                          | Total request latency                      |
| ttft_ms           | INTEGER     | NOT NULL                          | Time to first token                        |
| status            | VARCHAR(20) | NOT NULL                          | success \| rate_limited \| error           |
| created_at        | TIMESTAMP   | NOT NULL, DEFAULT now()           |                                            |

### Table: models
| Column          | Type         | Constraints             | Notes                             |
|-----------------|--------------|-------------------------|-----------------------------------|
| id              | UUID         | PK, NOT NULL            |                                   |
| model_id        | VARCHAR(100) | UNIQUE, NOT NULL        | Ollama tag, e.g. llama3.2:3b-...  |
| display_name    | VARCHAR(255) | NOT NULL                |                                   |
| quantization    | VARCHAR(20)  | NOT NULL                | e.g. Q4_K_M                       |
| file_size_gb    | FLOAT        | NOT NULL                |                                   |
| ram_required_gb | FLOAT        | NOT NULL                |                                   |
| context_window  | INTEGER      | NOT NULL, DEFAULT 2048  |                                   |
| is_active       | BOOLEAN      | NOT NULL, DEFAULT true  |                                   |
| is_loaded       | BOOLEAN      | NOT NULL, DEFAULT false | Only one true at a time           |
| activated_at    | TIMESTAMP    | NULLABLE                |                                   |

### Required Indexes
```sql
-- users
CREATE UNIQUE INDEX idx_users_email      ON users(email);
CREATE        INDEX idx_users_org_id     ON users(org_id);

-- api_keys
CREATE UNIQUE INDEX idx_api_keys_hash    ON api_keys(key_hash);
CREATE        INDEX idx_api_keys_user    ON api_keys(user_id);
CREATE        INDEX idx_api_keys_org     ON api_keys(org_id);

-- usage_logs  (time-range queries are the dominant access pattern)
CREATE INDEX idx_usage_key_time  ON usage_logs(api_key_id, created_at);
CREATE INDEX idx_usage_user_time ON usage_logs(user_id,    created_at);
CREATE INDEX idx_usage_org_time  ON usage_logs(org_id,     created_at);
CREATE INDEX idx_usage_time      ON usage_logs(created_at);
```

---

## ▌ API CONTRACTS

**Base URL:** `https://localhost/api/v1`
**Auth — user flows:** `Authorization: Bearer <JWT>`
**Auth — inference:** `Authorization: Bearer sk-<key>` (API key, not JWT)

### Full Route Table

| Method | Path                              | Min Role        | 201? | Notes |
|--------|-----------------------------------|-----------------|------|-------|
| POST   | /auth/register                    | Public          | ✓    | Returns user object |
| POST   | /auth/login                       | Public          | —    | Returns JWT + user snippet |
| POST   | /auth/refresh                     | Authenticated   | —    | Refresh JWT |
| GET    | /auth/me                          | Authenticated   | —    | Current user profile |
| POST   | /v1/chat/completions              | API Key         | —    | OpenAI-compatible; SSE if stream:true |
| GET    | /v1/models                        | API Key         | —    | List available models |
| GET    | /health                           | Public          | —    | Returns engine, model, db, uptime |
| GET    | /metrics                          | Internal only   | —    | Prometheus text; NOT via Traefik |
| POST   | /api-keys                         | user+           | ✓    | Plaintext shown once |
| GET    | /api-keys                         | user+           | —    | Role-scoped list |
| POST   | /api-keys/{id}/rotate             | Owner/lead+     | —    | New plaintext shown once |
| DELETE | /api-keys/{id}                    | Owner/lead+     | —    | Sets revoked_at |
| POST   | /orgs                             | super_admin     | ✓    | |
| GET    | /orgs/{id}                        | org_admin+      | —    | Includes member_count, active_keys |
| PUT    | /orgs/{id}                        | org_admin+      | —    | |
| DELETE | /orgs/{id}                        | super_admin     | —    | 409 if active users |
| POST   | /orgs/{id}/invite                 | org_admin+      | ✓    | Invite expires in 7 days |
| GET    | /orgs/{id}/users                  | team_lead+      | —    | |
| PATCH  | /orgs/{id}/users/{uid}            | org_admin       | —    | Role update only |
| DELETE | /orgs/{id}/users/{uid}            | org_admin       | —    | |
| GET    | /usage/me                         | Authenticated   | —    | ?start=&end=&key_id= |
| GET    | /usage/org/{id}                   | org_admin+      | —    | by_user breakdown |
| GET    | /admin/rate-limits                | super_admin     | —    | Global config |
| PUT    | /admin/rate-limits                | super_admin     | —    | Global config |
| PUT    | /orgs/{id}/rate-limits            | org_admin       | —    | Org-level override |
| PUT    | /models/active                    | super_admin     | —    | 503 if insufficient RAM |

### Request / Response Schemas

**POST /auth/register**
```json
// Request
{ "email": "alice@acme.com", "password": "Str0ng!Pass",
  "full_name": "Alice Smith", "org_id": "uuid-optional" }

// 201 Response (wrapped in standard envelope)
{ "user_id": "usr_abc123", "email": "alice@acme.com",
  "role": "user", "org_id": "org_xyz789", "created_at": "2026-05-07T10:00:00Z" }
```

**POST /auth/login**
```json
// Request
{ "email": "alice@acme.com", "password": "Str0ng!Pass" }

// 200 Response
{ "access_token": "eyJhbGci...", "token_type": "bearer", "expires_in": 3600,
  "user": { "user_id": "usr_abc123", "role": "org_admin", "org_id": "org_xyz789" } }
```

**POST /v1/chat/completions — non-streaming**
```json
// Request
{ "model": "llama3.2:3b-instruct-q4_K_M",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user",   "content": "Hello!" }
  ],
  "stream": false, "max_tokens": 512, "temperature": 0.7 }

// 200 Response  (OpenAI schema — NOT wrapped in standard envelope)
{ "id": "chatcmpl-abc123", "object": "chat.completion", "created": 1746612000,
  "model": "llama3.2:3b-instruct-q4_K_M",
  "choices": [{ "index": 0,
    "message": { "role": "assistant", "content": "Hi! How can I help?" },
    "finish_reason": "stop" }],
  "usage": { "prompt_tokens": 24, "completion_tokens": 8, "total_tokens": 32 } }
```

**POST /v1/chat/completions — streaming (stream: true)**
```
Content-Type: text/event-stream

data: {"id":"chatcmpl-abc","choices":[{"delta":{"content":"Hi"},"index":0}]}
data: {"id":"chatcmpl-abc","choices":[{"delta":{"content":"!"},"index":0}]}
data: [DONE]
```

**POST /api-keys**
```json
// Request
{ "name": "My dev key", "user_id": "usr_abc123",
  "rate_limit_rpm": 60, "expires_at": "2026-12-31T23:59:59Z" }

// 201 Response
{ "key_id": "key_abc123", "name": "My dev key",
  "api_key": "sk-abc1234567890abcdef",  // ← shown ONCE; never retrievable again
  "prefix": "sk-abc1", "user_id": "usr_abc123", "org_id": "org_xyz789",
  "rate_limit_rpm": 60, "created_at": "...", "expires_at": "..." }
```

**GET /api-keys** (paginated)
```json
{ "items": [{ "key_id": "key_abc123", "name": "My dev key", "prefix": "sk-abc1",
              "is_active": true, "rate_limit_rpm": 60,
              "last_used_at": "2026-05-06T18:30:00Z", "expires_at": "..." }],
  "total": 1, "page": 1, "page_size": 20 }
```

**GET /health**
```json
{ "status": "ok", "inference_engine": "ollama",
  "model_loaded": "llama3.2:3b-instruct-q4_K_M",
  "db": "connected", "uptime_seconds": 3842 }
```

**GET /usage/me**
```json
// ?start=2026-05-01&end=2026-05-07
{ "user_id": "usr_abc123",
  "period": { "start": "2026-05-01", "end": "2026-05-07" },
  "total_requests": 142, "total_prompt_tokens": 18400,
  "total_completion_tokens": 6200, "avg_latency_ms": 2340, "p99_latency_ms": 7800 }
```

**GET /usage/org/{id}**
```json
{ "org_id": "org_xyz789",
  "period": { "start": "2026-05-01", "end": "2026-05-07" },
  "total_requests": 1820, "total_tokens": 284000,
  "by_user": [{ "user_id": "usr_abc123", "requests": 142, "tokens": 24600 }] }
```

**GET /v1/models**
```json
{ "object": "list", "data": [{
    "id": "llama3.2:3b-instruct-q4_K_M", "object": "model",
    "is_active": true, "context_window": 2048,
    "ram_required_gb": 2.4, "quantization": "Q4_K_M" }] }
```

**GET /metrics** (text/plain — Prometheus format)
```
# HELP inference_ttft_seconds Time to first token
# TYPE inference_ttft_seconds histogram
inference_ttft_seconds_bucket{le="1.0"} 12
inference_ttft_seconds_bucket{le="3.0"} 94
inference_ttft_seconds_bucket{le="+Inf"} 142
# HELP inference_tokens_per_second Throughput gauge
inference_tokens_per_second 11.4
```

### HTTP Status Code Reference

| Code | Meaning           | When Used |
|------|-------------------|-----------|
| 200  | OK                | GET, PUT, PATCH, DELETE success |
| 201  | Created           | POST /auth/register, /orgs, /api-keys, /orgs/{id}/invite |
| 400  | Bad Request       | Malformed body / missing required field |
| 401  | Unauthorized      | Missing, invalid, or expired token / API key |
| 403  | Forbidden         | Authenticated but insufficient role; cross-org access |
| 404  | Not Found         | Resource does not exist |
| 409  | Conflict          | Duplicate email/slug; org has active users on delete |
| 422  | Unprocessable     | Pydantic v2 validation failure |
| 429  | Too Many Requests | Redis token bucket exceeded |
| 503  | Unavailable       | Ollama down or insufficient RAM for model switch |

---

## ▌ API RESPONSE ENVELOPE

**Every route** returns one of these two shapes — no exceptions.
The only exception is `/v1/chat/completions` and `/v1/models` which return the raw
OpenAI-compatible schema to preserve client compatibility.

```python
# app/schemas/base.py

def ok(data, meta: dict | None = None) -> dict:
    resp = {"success": True, "data": data}
    if meta:
        resp["meta"] = meta
    return resp

def error_response(code: str, message: str, details=None) -> dict:
    resp = {"success": False, "error": {"code": code, "message": message}}
    if details:
        resp["error"]["details"] = details
    return resp
```

**Success shape:**
```json
{ "success": true, "data": { ... },
  "meta": { "page": 1, "page_size": 20, "total": 142 } }
```
`meta` present only on paginated list responses.

**Error shape:**
```json
{ "success": false, "error": { "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Retry after 4s", "details": {} } }
```

**Pagination:** all list endpoints accept `?page=1&page_size=20` (max 100).

---

## ▌ EXCEPTION HANDLING

### Exception class hierarchy (app/exceptions.py)
```python
class AppError(Exception):
    status_code: int = 500
    error_code:  str = "INTERNAL_ERROR"
    message:     str = "An unexpected error occurred"

class NotFoundError(AppError):
    status_code = 404;  error_code = "NOT_FOUND"

class ForbiddenError(AppError):
    status_code = 403;  error_code = "FORBIDDEN"

class UnauthorizedError(AppError):
    status_code = 401;  error_code = "UNAUTHORIZED"

class ConflictError(AppError):
    status_code = 409;  error_code = "CONFLICT"

class RateLimitError(AppError):
    status_code = 429;  error_code = "RATE_LIMITED"

class ValidationError(AppError):
    status_code = 422;  error_code = "VALIDATION_ERROR"

class InferenceUnavailableError(AppError):
    status_code = 503;  error_code = "INFERENCE_UNAVAILABLE"
```

### Global handlers (register in app/main.py)
```python
@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    logger.error("AppError", extra={"error_code": exc.error_code, "detail": str(exc)})
    return JSONResponse(status_code=exc.status_code,
                        content=error_response(exc.error_code, str(exc)))

@app.exception_handler(Exception)
async def generic_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception")
    return JSONResponse(status_code=500,
                        content=error_response("INTERNAL_ERROR", "Unexpected error"))
```

### Rules
- **Never** raise `HTTPException` in route handlers — raise `AppError` subclasses only.
- **Never** let `SQLAlchemy IntegrityError` propagate — catch it; re-raise as `ConflictError`.
- **Always** call `logger.exception()` server-side to capture full stack traces.
- **Never** include stack traces in HTTP responses in any environment.

---

## ▌ LOGGING FORMAT

All logs emitted as **structured JSON to stdout**. Library: `python-json-logger`.

### Log schema
```json
{
  "timestamp":  "2026-05-07T10:00:01Z",   // ISO 8601 UTC
  "level":      "INFO",                    // DEBUG|INFO|WARNING|ERROR|CRITICAL
  "logger":     "app.api.v1.inference",    // __name__ — never root logger
  "request_id": "a1b2c3d4",               // UUID; injected per request
  "user_id":    "usr_abc123",             // null if unauthenticated
  "org_id":     "org_xyz789",             // null if unauthenticated
  "message":    "Inference request complete",
  "extra": {
    "model":            "llama3.2:3b-instruct-q4_K_M",
    "prompt_tokens":    24,
    "completion_tokens": 8,
    "latency_ms":       2340,
    "ttft_ms":          1820
  }
}
```

### Rules
- `logger = logging.getLogger(__name__)` — **never** use the root logger.
- **Never** log API key plaintext, JWT tokens, or passwords — log `key_id` or `key_prefix`.
- `request_id` **must** be present on every log line within a request context.
- INFO for normal ops; WARNING for recoverable issues (429, 404); ERROR for exceptions.
- Inference latency **and** TTFT **must** be logged at INFO for every completion request.

---

## ▌ RATE LIMITING — REDIS TOKEN BUCKET

### Redis key structure
```
KEY:    ratelimit:{key_id}
TYPE:   Hash
FIELDS: tokens       FLOAT   (current token count; starts at capacity)
        last_refill  FLOAT   (Unix timestamp of last refill)
TTL:    120 seconds  (auto-expires idle buckets; refills correctly on next request)
```

### Atomic Lua script (app/core/rate_limiter.py)
```lua
local key      = KEYS[1]
local capacity = tonumber(ARGV[1])       -- = rpm (e.g. 60)
local rate     = tonumber(ARGV[2])       -- tokens/sec = rpm / 60
local now      = tonumber(ARGV[3])       -- time.time()
local ttl      = tonumber(ARGV[4])       -- REDIS_BUCKET_TTL_SECONDS

local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(bucket[1]) or capacity
local last   = tonumber(bucket[2]) or now

local elapsed = now - last
tokens = math.min(capacity, tokens + elapsed * rate)

if tokens < 1 then
    -- return: [allowed=0, remaining_millis, retry_after_seconds]
    return {0, math.floor(tokens * 1000), math.ceil((1 - tokens) / rate)}
end

tokens = tokens - 1
redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
redis.call('EXPIRE', key, ttl)
return {1, math.floor(tokens * 1000), 0}
```

### Response headers (set on every inference response)
```
X-RateLimit-Limit:     {rpm}
X-RateLimit-Remaining: {tokens_remaining}
X-RateLimit-Reset:     {retry_after_seconds}
```

---

## ▌ REQUEST MIDDLEWARE CHAIN

Every request passes through this chain **in this exact order**:

```
1. TLS termination          ← Traefik reverse proxy in Docker Compose (before FastAPI)
2. CORS middleware           ← CORSMiddleware; allow CORS_ORIGINS env var
3. Request ID injection      ← generate UUID; attach to request.state; add X-Request-ID header
4. Auth middleware            ← JWT decode OR SHA-256(bearer) → DB lookup on api_keys.key_hash
5. Rate limit middleware      ← Redis Lua token bucket per key_id; raises RateLimitError → 429
6. RBAC dependency            ← route-level Depends(require_role(...)); raises ForbiddenError → 403
7. Route handler              ← call service layer; never call DB directly in routes
8. Usage log background task  ← BackgroundTasks.add_task(); fire-and-forget; never block response
9. Prometheus metrics update  ← increment counters/histograms after response sent
```

---

## ▌ INFERENCE PIPELINE — STEP-BY-STEP

For every `POST /v1/chat/completions` with an API key:

1. **Auth:** Compute `SHA-256(bearer_token)` → `SELECT * FROM api_keys WHERE key_hash = ? AND is_active = true`. If missing → `UnauthorizedError`. If `expires_at < now()` → `UnauthorizedError`.
2. **Rate limit:** Run Redis Lua bucket for `key_id`. If `tokens < 1` → `RateLimitError` (429).
3. **RBAC:** All four roles may call inference — just confirm the user is authenticated.
4. **Proxy to Ollama:** `POST http://host.docker.internal:11434/api/chat` with model + messages.
   - `stream=false` → await full Ollama response → reformat to OpenAI `chat.completion` schema → return JSON.
   - `stream=true`  → pipe Ollama's chunked response → re-emit as SSE (`data: {...}\n\n`) → terminate with `data: [DONE]`.
5. **Usage log:** `BackgroundTasks.add_task(log_usage, api_key_id, user_id, org_id, model_id, prompt_tokens, completion_tokens, total_tokens, latency_ms, ttft_ms, status)`.
6. **Metrics:** Increment `inference_requests_total{status, model}`, observe `inference_ttft_seconds`, `inference_tokens_total{type}`.

---

## ▌ ENVIRONMENT VARIABLES

All config via env vars. `pydantic-settings` `BaseSettings` in `app/config.py`.
**App refuses to start if any required variable is absent.**

| Variable                  | Required | Default                          | Notes |
|---------------------------|----------|----------------------------------|-------|
| DATABASE_URL              | Yes      | —                                | `postgresql+asyncpg://user:pass@host:5432/db` |
| REDIS_URL                 | Yes      | —                                | `redis://:password@redis:6379/0` |
| JWT_SECRET                | Yes      | —                                | Min 32 chars; rotate every 90 days |
| JWT_ALGORITHM             | No       | HS256                            | Do not change |
| JWT_EXPIRE_MINUTES        | No       | 60                               | |
| OLLAMA_BASE_URL           | Yes      | —                                | `http://host.docker.internal:11434` |
| OLLAMA_DEFAULT_MODEL      | No       | llama3.2:3b-instruct-q4_K_M     | |
| DEFAULT_RATE_LIMIT_RPM    | No       | 60                               | |
| REDIS_BUCKET_TTL_SECONDS  | No       | 120                              | |
| LOG_LEVEL                 | No       | INFO                             | DEBUG\|INFO\|WARNING\|ERROR |
| ENVIRONMENT               | No       | development                      | `production` disables debug |
| CORS_ORIGINS              | No       | http://localhost:3000            | Comma-separated |
| PROMETHEUS_ENABLED        | No       | true                             | |

### Settings class skeleton (app/config.py)
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str           = "HS256"
    JWT_EXPIRE_MINUTES: int      = 60
    OLLAMA_BASE_URL: str
    OLLAMA_DEFAULT_MODEL: str    = "llama3.2:3b-instruct-q4_K_M"
    DEFAULT_RATE_LIMIT_RPM: int  = 60
    REDIS_BUCKET_TTL_SECONDS: int = 120
    LOG_LEVEL: str               = "INFO"
    ENVIRONMENT: str             = "development"
    CORS_ORIGINS: str            = "http://localhost:3000"
    PROMETHEUS_ENABLED: bool     = True

    class Config:
        env_file = ".env"

settings = Settings()
```

### Secret rules
- `.env` is **never** committed. Only `.env.example` (placeholders) lives in source control.
- In Docker Compose: secrets stored in `.env` files (never committed) or Docker secrets; injected via `env_file` directive.
- `JWT_SECRET` min 32 chars; rotated every 90 days.
- `DATABASE_URL` and `REDIS_URL` passwords must **never** appear in logs or error output.

---

## ▌ NAMING CONVENTIONS

| Context                     | Convention              | Example |
|-----------------------------|-------------------------|---------|
| Python files                | snake_case              | `api_key_service.py` |
| Python classes              | PascalCase              | `ApiKeyService`, `OrgAdminPermission` |
| Python functions/variables  | snake_case              | `get_api_key_by_hash()`, `user_id` |
| Python constants            | SCREAMING_SNAKE_CASE    | `DEFAULT_RPM`, `JWT_ALGORITHM` |
| Pydantic schemas            | PascalCase + suffix     | `ApiKeyCreateRequest`, `ApiKeyResponse` |
| SQLAlchemy ORM models       | PascalCase              | `Organisation`, `ApiKey`, `UsageLog` |
| DB table names              | snake_case plural       | `organisations`, `api_keys`, `usage_logs` |
| DB column names             | snake_case              | `key_hash`, `rate_limit_rpm`, `created_at` |
| DB indexes                  | idx_{table}_{column(s)} | `idx_api_keys_hash`, `idx_users_org_id` |
| API routes                  | kebab-case nouns        | `POST /api-keys`, `GET /orgs/{id}/users` |
| React components            | PascalCase              | `ApiKeyTable`, `OrgSwitcher` |
| React hooks                 | camelCase, `use` prefix | `useApiKeys()`, `useAuthStore()` |
| TypeScript types            | PascalCase              | `ApiKeyResponse`, `OrgUser` |
| Env variables               | SCREAMING_SNAKE_CASE    | `DATABASE_URL`, `JWT_SECRET` |
| Docker Compose services     | kebab-case              | `api-backend`, `postgres-db`, `redis-cache` |
| Docker image tags           | kebab-case:semver       | `api-backend:1.0.0`, `frontend:1.0.0` |

---


### Startup order
```
1. PostgreSQL     — healthcheck: pg_isready on :5432
2. Redis          — healthcheck: redis-cli ping on :6379
3. api-backend    — depends_on: postgres, redis (healthy); entrypoint: alembic upgrade head
4. api-backend    — main: healthcheck GET /health → 200
5. frontend       — depends_on: api-backend (healthy)
6. Prometheus     — depends_on: api-backend (healthy)
7. Grafana        — depends_on: prometheus (started)
8. Traefik        — depends_on: api-backend, frontend (healthy)
9. Ollama (host)  — start BEFORE docker compose up; model must be loaded on :11434
```

### Key Docker Compose snippets

**Migration entrypoint (docker-compose.yml — api-backend service):**
```yaml
api-backend:
  image: api-backend:latest
  entrypoint: ['sh', '-c', 'alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000']
  env_file: .env
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
```

**Health checks:**
```yaml
api-backend:
  healthcheck:
    test: ['CMD', 'curl', '-f', 'http://localhost:8000/health']
    interval: 10s
    timeout: 5s
    retries: 3
    start_period: 15s
```

**Traefik routing labels:**
```yaml
api-backend:
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.api.rule=PathPrefix(`/api`)"
    - "traefik.http.routers.api.entrypoints=websecure"
    - "traefik.http.routers.api.tls=true"
    - "traefik.http.services.api.loadbalancer.server.port=8000"
```

**Redis password injection:**
```yaml
redis:
  image: redis:7-alpine
  command: ['redis-server', '--requirepass', '${REDIS_PASSWORD}']
  env_file: .env
```

---

## ▌ SECURITY RULES

| Concern            | Rule |
|--------------------|------|
| API key storage    | SHA-256 hex hash only. Plaintext shown **once** at creation — never again, only rotation. |
| Key prefix         | First 7 chars (e.g. `sk-abc1`) stored for UI identification; never the secret itself. |
| Password storage   | bcrypt with default cost factor. Plaintext never stored, never logged. |
| JWT                | HS256; include `user_id`, `org_id`, `role` claims; validate on every authenticated request. |
| Logging            | Never log API key plaintext, JWT tokens, or passwords. Log `key_id` or `key_prefix`. |
| TLS                | All traffic via Traefik HTTPS. No plaintext HTTP paths from client to API. |
| Cross-org access   | Always 403; check `org_id` before any DB query on org-scoped resource. |
| Input validation   | Pydantic v2 on all request bodies. Never trust raw request data. |
| CVE hygiene        | `pip-audit` must pass with no critical CVEs before Phase 4 sign-off. |
| Secrets in Docker  | `.env` files or Docker secrets only; never in docker-compose.yml directly; never committed to git. |

---

## ▌ HARDWARE & MODEL CONSTRAINTS

| Constraint | Value |
|------------|-------|
| Total RAM  | 8 GB DDR4 (shared: OS + Docker containers + Ollama) |
| GPU        | None — CPU inference only (llama.cpp) |
| Max GGUF size | 4 GB (Q4_K_M format required) |
| Ollama config | `OLLAMA_MAX_LOADED_MODELS=1`, `num_ctx=2048` |
| RAM budget | Ollama ~2.4 GB + OS ~1.5 GB + all Docker containers ~1.5 GB ≈ 5.4 GB of 8 GB |
| Primary model | `llama3.2:3b-instruct-q4_K_M` (1.9 GB GGUF, ~2.4 GB RAM, 8–18 tok/s) |
| Accepted TTFT | 1.5–3 s (CPU-only baseline) |

---

## ▌ DEVELOPMENT ENVIRONMENT

| Constraint       | Value |
|------------------|-------|
| Host OS          | Windows with WSL (Ubuntu/Debian) |
| Development Shell| **WSL bash** |
| Installations    | Must be performed within WSL |
| Sudo Password    | **1234** |

### Guidelines
- **NEVER** run `npm`, `pip`, `docker compose`, or `git` commands directly in Windows PowerShell or CMD.
- **ALWAYS** prefix host-side commands with `wsl` if running from a Windows-native context, or work entirely within the WSL terminal.
- Use `sudo` within WSL for system-level changes, providing the password `1234` when prompted.

---

## ▌ OUT OF SCOPE — DO NOT IMPLEMENT

```
✗ Kubernetes / K8s / K3s / KServe / distributed inference
✗ vLLM, TensorRT-LLM, or any GPU-dependent inference engine
✗ Model fine-tuning or training pipelines
✗ Billing, payments, or subscription management
✗ OAuth, OIDC, SAML, or any external identity provider
✗ Production cloud deployment (AWS / GCP / Azure)
✗ Nginx  (replaced by Traefik)
✗ Kubernetes / K3s  (replaced by Docker Compose)
✗ slowapi  (replaced by Redis token bucket)
✗ WebSockets  (SSE is the only streaming mechanism)
✗ Loading more than one model simultaneously
```

---
# END OF CONSTITUTION