# Tasks: Initial Inference Layer

**Feature**: [Initial Inference Layer](file:///c:/Users/MuhamedJasim/AI-Inference-Platform-SDD/specs/001-initial-inference-layer/plan.md)
**Status**: Pending
**Priority**: High (P1 Core Feature)

## Implementation Strategy
- **Incremental Delivery**: Build foundational backend auth and database setup first.
- **MVP (US1)**: Focused on getting the first chat completion (streaming) working end-to-end.
- **User Story 2 (Auth)**: Implemented after foundational DB setup to enable persistent sessions and API key management.
- **User Story 3 (Models/History)**: Added as an enhancement to provide model information and session continuity.

---

## Phase 1: Setup
*Goal: Initialize repository structure and development environment.*

- [X] T001 Initialize backend project structure with `pyproject.toml` and `alembic.ini` in `backend/`
- [X] T002 Initialize frontend project structure with Vite (React + TypeScript) in `frontend/`
- [X] T003 [P] Configure `docker-compose.yml` for PostgreSQL, Redis, and Traefik in repository root
- [X] T004 [P] Create `backend/app/config.py` with Pydantic BaseSettings and `.env.example`
- [X] T005 [P] Setup structured logging in `backend/app/logging_config.py` using `python-json-logger`

## Phase 2: Foundational Infrastructure
*Goal: Core utilities, database connectivity, and base error handling.*

- [X] T006 Implement async database session factory in `backend/app/db/session.py`
- [X] T007 Implement global AppError hierarchy and handlers in `backend/app/exceptions.py`
- [X] T008 [P] Implement standard API response envelope in `backend/app/schemas/base.py`
- [X] T009 Implement Redis Lua token-bucket rate limiter in `backend/app/core/rate_limiter.py`
- [X] T010 Implement JWT token utilities (HS256) and password hashing in `backend/app/core/auth.py`

## Phase 3: User Story 2 — Authentication & API Keys
*Goal: Enable user registration, login, and key management to authorize inference.*

- [X] T011 [US2] Create User and APIKey SQLAlchemy models in `backend/app/models/user.py` and `api_key.py`
- [X] T012 [US2] Create Alembic migrations for users and api_keys tables in `backend/app/db/migrations/`
- [X] T013 [US2] Implement `AuthService` for registration/login in `backend/app/services/auth_service.py`
- [X] T014 [US2] Implement `ApiKeyService` for key hashing and lifecycle in `backend/app/services/api_key_service.py`
- [X] T015 [US2] Create Pydantic schemas for Auth and API Keys in `backend/app/schemas/auth.py` and `api_key.py`
- [X] T016 [US2] Implement Auth routes (register, login, me) in `backend/app/api/v1/auth.py`
- [X] T017 [US2] Implement API Key management routes in `backend/app/api/v1/api_keys.py`
- [X] T018 [US2] [P] Implement authentication middleware (JWT + API Key) in `backend/app/main.py` or `dependencies.py`

## Phase 4: User Story 1 — AI Inference Layer (Core)
*Goal: End-to-end chat completion proxy to Ollama with streaming support.*

- [X] T019 [US1] Create `UsageLog` and `Model` SQLAlchemy models in `backend/app/models/usage_log.py` and `model_registry.py`
- [X] T020 [US1] Implement `InferenceService` with Ollama proxying (httpx) in `backend/app/services/inference_service.py`
- [X] T021 [US1] Create Pydantic schemas for Chat Completions (OpenAI compatible) in `backend/app/schemas/inference.py`
- [X] T022 [US1] Implement `POST /v1/chat/completions` (streaming & non-streaming) in `backend/app/api/v1/inference.py`
- [X] T023 [US1] Implement usage logging background task in `backend/app/services/usage_service.py`
- [X] T024 [US1] [P] Implement Prometheus metrics collection for inference in `backend/app/core/metrics.py`

## Phase 5: User Story 1 & 2 — Chat UI & Integration
*Goal: Web interface for interacting with the inference layer.*

- [X] T025 [P] [US2] Implement Auth store and API client in `frontend/src/store/authStore.ts` and `api/auth.ts`
- [X] T026 [US2] Create Login and Registration pages in `frontend/src/pages/`
- [X] T027 [P] [US1] Implement Chat store and SSE streaming logic in `frontend/src/store/chatStore.ts` and `api/inference.ts`
- [X] T028 [US1] Create Chat UI components (MessageList, InputField) in `frontend/src/components/`
- [X] T029 [US1] Assemble Chat Page with multi-turn history support in `frontend/src/pages/ChatPage.tsx`
- [X] T030 [US1] Implement error handling and rate-limit feedback in the chat UI

## Phase 6: User Story 3 — Models & History Enhancements
*Goal: Model info display and session continuity.*

- [ ] T031 [US3] Implement `GET /v1/models` endpoint in `backend/app/api/v1/inference.py`
- [ ] T032 [US3] Create `ModelInfo` component in `frontend/src/components/ModelInfo.tsx`
- [ ] T033 [US3] Integrate model selection/info into the Chat Page sidebar
- [ ] T034 [US3] Ensure chat history persists across UI navigation within the same session (Zustand)

## Phase 7: Polish & Final Validation
*Goal: Performance optimization, security check, and observability.*

- [ ] T035 [P] Configure Traefik routing and TLS in `traefik/dynamic/routes.yml`
- [ ] T036 Implement system health check endpoint in `backend/app/api/v1/health.py`
- [ ] T037 Conduct end-to-end testing of streaming responses on the host-native Ollama
- [ ] T038 Verify rate limiting headers and 429 response handling in both API and UI
- [ ] T039 [P] Finalize Grafana dashboards and Prometheus alerting rules

---

## Dependencies
1. **Infrastructure (Phase 1/2)**: Must be complete before any user story implementation.
2. **Auth (Phase 3)**: Provides the API keys and user context required for Inference (Phase 4).
3. **Inference Backend (Phase 4)**: Must be functional before Chat UI (Phase 5) integration.
4. **Chat UI (Phase 5)**: Relies on both Auth and Inference endpoints.

## Parallel Execution Examples
- **Frontend/Backend Split**: While Phase 3 backend is in progress, frontend Phase 5 (Auth UI) can start (T025, T026).
- **Inference Enhancements**: Phase 6 (Models) can be developed independently of the core Chat logic once the base Inference service exists.
- **DevOps**: Traefik and Observability tasks (T035, T039) can run in parallel with application development.

## Story Completion Criteria
- **US1 (Chat)**: User can send a message in the UI and see a streamed response from Llama 3.2.
- **US2 (Auth)**: User can register, login, and generate a working API key.
- **US3 (Models)**: Active model details are visible in the UI; session history is maintained.
