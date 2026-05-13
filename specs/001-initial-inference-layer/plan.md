# Implementation Plan: Initial Inference Layer

**Branch**: `001-initial-inference-layer` | **Date**: 2026-05-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-initial-inference-layer/spec.md`

## Summary

Build the foundational AI inference layer: a FastAPI backend that proxies chat requests to a local Ollama engine (CPU-only, single GGUF model), exposes OpenAI-compatible endpoints (`/v1/chat/completions`, `/v1/models`), supports streaming (SSE) and non-streaming modes, authenticates users via JWT + API keys with Redis token-bucket rate limiting, and provides a React + TypeScript chat UI for multi-turn conversations. Organisation support is deferred; users register standalone.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript 5.x (frontend)
**Primary Dependencies**: FastAPI + Uvicorn, SQLAlchemy 2 (async) + Alembic, React + Vite, Zustand, Axios
**Storage**: PostgreSQL 16 (async via asyncpg), Redis (rate limiting + token bucket)
**Testing**: pytest + httpx (async)
**Target Platform**: Docker Compose on local Linux/WSL host (8 GB RAM, CPU-only)
**Project Type**: Web service + SPA
**Performance Goals**: TTFT < 3s, total response < 10s for ~200 tokens, 5 concurrent sessions
**Constraints**: CPU-only inference, single GGUF model loaded, 8 GB RAM total, no K8s, no GPU
**Scale/Scope**: Internal PoC, small team, single host deployment

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Evidence |
|------|--------|----------|
| No slowapi — Redis token bucket only | ✅ PASS | FR-006 specifies token bucket; rate_limiter.py uses Lua script |
| No Kubernetes / K8s / K3s | ✅ PASS | Docker Compose orchestration only |
| No Nginx | ✅ PASS | Traefik for TLS/routing |
| No OAuth / OIDC / SAML | ✅ PASS | JWT (HS256) + bcrypt + SHA-256 key hashing |
| No synchronous SQLAlchemy | ✅ PASS | asyncpg + async session factory |
| No HTTPException in routes | ✅ PASS | AppError hierarchy per constitution |
| No print() — structured logger | ✅ PASS | python-json-logger, `logging.getLogger(__name__)` |
| No plaintext secrets committed | ✅ PASS | .env never committed; .env.example only |
| No plaintext API key / password storage | ✅ PASS | SHA-256 hash for keys, bcrypt for passwords |
| Single model loaded (OLLAMA_MAX_LOADED_MODELS=1) | ✅ PASS | Spec assumes single pre-loaded model |
| Ollama runs on host, not in Docker | ✅ PASS | host.docker.internal:11434 |
| /metrics not exposed via Traefik | ✅ PASS | Internal-only access |
| Org deferred (deviation from constitution) | ⚠️ NOTED | Constitution mandates org_id on users; this feature defers it. Justified: initial PoC layer — org support is a planned follow-up feature. User table will include nullable org_id for forward compatibility. |

**Result: ALL GATES PASS** (one noted deviation, justified and forward-compatible)

## Project Structure

### Documentation (this feature)

```text
specs/001-initial-inference-layer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── main.py              # App factory + lifespan + middleware registration
│   ├── config.py            # Pydantic BaseSettings — env vars only
│   ├── dependencies.py      # get_db, get_redis, get_current_user
│   ├── exceptions.py        # AppError hierarchy + global handlers
│   ├── logging_config.py    # python-json-logger structured setup
│   ├── api/
│   │   ├── router.py        # Top-level APIRouter aggregator
│   │   └── v1/
│   │       ├── auth.py      # POST /auth/register, /auth/login, /auth/me
│   │       ├── inference.py # POST /v1/chat/completions, GET /v1/models
│   │       └── api_keys.py  # POST /api-keys, GET /api-keys, DELETE /api-keys/{id}
│   ├── core/
│   │   ├── auth.py          # JWT create/validate; SHA-256 key hashing; bcrypt
│   │   ├── rate_limiter.py  # Redis Lua token bucket
│   │   └── metrics.py       # Prometheus counter/histogram definitions
│   ├── models/              # SQLAlchemy ORM — one file per table
│   │   ├── user.py
│   │   ├── api_key.py
│   │   ├── usage_log.py
│   │   └── model_registry.py
│   ├── schemas/             # Pydantic schemas — one file per domain
│   │   ├── base.py          # ok() / error_response() envelope
│   │   ├── auth.py
│   │   ├── api_key.py
│   │   ├── inference.py
│   │   └── usage.py
│   ├── services/            # Business logic — no DB calls in routes
│   │   ├── auth_service.py
│   │   ├── api_key_service.py
│   │   ├── inference_service.py
│   │   └── usage_service.py
│   └── db/
│       ├── session.py       # Async engine + session factory
│       └── migrations/      # Alembic (env.py, script.py.mako, versions/)
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_inference.py
│   └── test_api_keys.py
├── Dockerfile
├── pyproject.toml
└── alembic.ini

frontend/
├── src/
│   ├── api/                 # Axios client + typed API functions
│   │   ├── client.ts        # Axios instance with interceptors
│   │   ├── auth.ts          # login, register, getMe
│   │   └── inference.ts     # sendMessage (SSE + non-streaming)
│   ├── components/          # Reusable UI components
│   │   ├── ChatMessage.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ModelInfo.tsx
│   │   └── Layout.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── ChatPage.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useChat.ts
│   ├── store/
│   │   ├── authStore.ts     # Zustand: JWT, user profile
│   │   └── chatStore.ts     # Zustand: messages, streaming state
│   └── types/
│       └── index.ts         # Shared TypeScript types
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json

docker-compose.yml
traefik/
├── traefik.yml
└── dynamic/
    └── routes.yml
observability/
├── prometheus.yml
└── grafana/dashboards/inference.json
.env.example
```

**Structure Decision**: Web application layout (backend + frontend) per constitution repository structure. Org-related files (`orgs.py`, `org_service.py`, `org.py` schema, `organisation.py` model) are omitted from this initial feature and will be added in the organisation feature. Permissions module deferred (no RBAC matrix needed without orgs — all authenticated users have equal access in this layer).

## Complexity Tracking

| Deviation | Why Needed | Forward Compatibility |
|-----------|------------|----------------------|
| No Organisation model/routes | Spec explicitly defers org support | User.org_id will be nullable FK, ready for org feature |
| No RBAC permissions module | No org-scoped roles without orgs | permissions.py placeholder created; full matrix in org feature |
| No admin routes | Super admin needs org context | admin.py deferred to org feature |
