# Implementation Plan: Unified Authentication, Verification & Recovery

**Branch**: `003-unified-auth-verification` | **Date**: May 18, 2026 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/003-unified-auth-verification/spec.md`

## Summary

This feature delivers a unified, zero-friction authentication flow across the AI Inference Platform. By combining sign-up and log-in screens, adding secure transactional email flows (sign-up email verification and forgot-password recovery), and implementing a highly secure, offline-capable Mock Google SSO flow, we deliver a premium client experience while respecting the platform's local-first architecture. 

All identity records, session state, and verification steps reside locally inside our FastAPI + PostgreSQL stack, maintaining strict host-only isolation.

## Technical Context

**Language/Version**: Python 3.12 (Backend), TypeScript 5+ (Frontend)  
**Primary Dependencies**: FastAPI, SQLAlchemy 2 (async), Pydantic v2, Zustand, Axios, React 18  
**Storage**: PostgreSQL 16 (for user persistence), Redis (for session tokens & verification cache)  
**Testing**: pytest, httpx  
**Target Platform**: Linux server (via Docker Compose)  
**Project Type**: REST API Web Service & Web Application  
**Performance Goals**: Auth route operations completing in < 150ms; instant token validation  
**Constraints**: 100% local-first; absolutely no external identity provider HTTP requests allowed (Mock Google SSO); verification token lifespan limited to 24 hours; password recovery token lifespan limited to 1 hour  
**Scale/Scope**: Dynamic signup/login route aggregation; custom email delivery templates; unified state transitions  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] No `slowapi`, Kubernetes, Nginx, vLLM, TensorRT, or GPU libraries.
- [x] No synchronous SQLAlchemy or raw psycopg2 drivers in application code.
- [x] No external IdP (OAuth/SAML) used. Google SSO is implemented as a self-contained local simulation.
- [x] `HTTPException` is never raised in routes; using `AppError` subclasses.
- [x] JSON structured logger `python-json-logger` is utilized; no `print()` statements.
- [x] Plaintext passwords and API keys are NEVER stored or committed; using bcrypt hashes.

## Project Structure

### Documentation (this feature)

```text
specs/003-unified-auth-verification/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 database migrations
├── quickstart.md        # Phase 1 interface reference
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       └── auth.py             # Auth endpoints (/auth/sso/google, /auth/verify, /auth/recover)
│   ├── core/
│   │   └── auth.py                 # Token generation (verification + recovery)
│   ├── models/
│   │   └── user.py                 # Extended User model fields
│   ├── schemas/
│   │   └── auth.py                 # Extended Pydantic validation
│   └── services/
│       ├── auth_service.py         # Registration, Verification, Recovery logic
│       └── email_service.py        # [NEW] Mock transactional SMTP dispatcher
└── tests/
    └── test_auth.py                # Verification & recovery test suite

frontend/
├── src/
│   ├── api/
│   │   └── auth.ts                 # Axios bindings
│   ├── components/
│   │   ├── GoogleSsoButton.tsx     # [NEW] SSO integration trigger
│   │   └── MockGoogleConsent.tsx   # [NEW] Interactive mock consent modal
│   ├── pages/
│   │   ├── AuthPage.tsx            # Unified login/register screen
│   │   ├── ResetPasswordPage.tsx   # [NEW] Recovery landing page
│   │   └── VerifyEmailPage.tsx     # [NEW] Auto-login landing page
│   └── store/
│       └── authStore.ts            # Extends Zustand state
```

**Structure Decision**: Web application structure encompassing both `backend` and `frontend` projects within the strict monorepo layout.

## Complexity Tracking

*No constitution violations present. All constraints are strictly met.*
