# Implementation Plan: Phase-2: Multi-tenancy & Admin UI

**Branch**: `002-multi-tenancy-admin-ui` | **Date**: 2026-05-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/002-multi-tenancy-admin-ui/spec.md`

## Summary

Phase 2 will implement the multi-tenant architecture and Role-Based Access Control (RBAC) layer for the AI Inference Platform. It introduces hard isolation boundaries between organisations, role-based endpoint protection (super_admin, org_admin, team_lead, user), and role-scoped API key management. The implementation relies entirely on dependency injection for RBAC enforcement and atomic database operations, in strict adherence to the project constitution.

## Technical Context

**Language/Version**: Python 3.12 (Backend)
**Primary Dependencies**: FastAPI, SQLAlchemy 2 (async), asyncpg, Pydantic v2
**Storage**: PostgreSQL 16
**Testing**: pytest, httpx
**Target Platform**: Linux server (via Docker Compose)
**Project Type**: REST API Web Service
**Performance Goals**: Low-latency route evaluation; < 100ms for admin operations
**Constraints**: All RBAC logic must live in `backend/app/core/permissions.py`; no inline role checks in routes.
**Scale/Scope**: 4 explicit user roles, organisation data isolation, API key CRUD scoped by role.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] No `slowapi`, Kubernetes, Nginx, vLLM, TensorRT.
- [x] No synchronous SQLAlchemy or raw psycopg2.
- [x] No external IdP (OAuth/SAML) used.
- [x] `HTTPException` not used directly; using `AppError` subclasses.
- [x] Structured logger `python-json-logger` used instead of `print()`.
- [x] Secrets and tokens never stored in plaintext (API keys securely hashed with SHA-256).

## Project Structure

### Documentation (this feature)

```text
specs/002-multi-tenancy-admin-ui/
├── plan.md              # This file
├── research.md          # Empty (no unknowns)
├── data-model.md        # DB schemas and migrations rules
├── quickstart.md        # API reference and setup 
└── tasks.md             # (To be generated later)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── orgs.py             # Organisation CRUD
│   │       ├── users.py            # User assignment & invites
│   │       └── api_keys.py         # Role-scoped API Keys (extended)
│   ├── core/
│   │   └── permissions.py          # RBAC decorators and helpers
│   ├── schemas/
│   │   ├── org.py                  # Pydantic validation
│   │   ├── user.py                 # Pydantic validation
│   │   └── api_key.py              # Pydantic validation
│   └── services/
│       ├── org_service.py          # DB operations
│       ├── user_service.py         # DB operations
│       └── api_key_service.py      # DB operations
└── tests/
    ├── test_orgs.py
    ├── test_users.py
    └── test_api_keys.py
```

**Structure Decision**: Web application (backend only) matching the constitution's strict monorepo layout.
