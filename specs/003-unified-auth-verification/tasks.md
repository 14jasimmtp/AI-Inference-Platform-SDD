# Tasks: Unified Authentication, Verification & Recovery

**Input**: Design documents from `/specs/003-unified-auth-verification/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Exact file paths are included in descriptions.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Configure Mailpit SMTP container definition in `docker-compose.yml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database schema updates and system integrations that must be complete before user stories begin

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Create and test the extended user schema columns Alembic migration script in `backend/app/db/migrations/versions/003_add_unified_auth.py`
- [x] T003 [P] Update SQLAlchemy User ORM model mappings in `backend/app/models/user.py`
- [x] T004 [P] Implement secure token generator helpers in `backend/app/core/auth.py`
- [x] T005 [P] Setup Mailpit SMTP server url and port values in `backend/app/config.py`
- [x] T006 [P] Create asynchronous SMTP mail sender service in `backend/app/services/email_service.py`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Unified Sign In/Up with Google SSO (Priority: P1) 🎯 MVP

**Goal**: Seamless one-click login and registration via simulated local Google SSO

**Independent Test**: Click "Continue with Google", approve consent, verify immediate login and token issue.

- [x] T007 [P] [US1] Implement Google SSO schemas in `backend/app/schemas/auth.py`
- [x] T008 [US1] Build Google SSO user lookup and creation logic in `backend/app/services/auth_service.py`
- [x] T009 [US1] Expose Google SSO routes `/auth/sso/google` and `/auth/sso/google/callback` in `backend/app/api/v1/auth.py`
- [x] T010 [P] [US1] Design standard mock authorization consent visual component in `frontend/src/components/MockGoogleConsent.tsx`
- [x] T011 [P] [US1] Build unified Google SSO brand button in `frontend/src/components/GoogleSsoButton.tsx`
- [x] T012 [US1] Integrate Google SSO flow in `frontend/src/pages/AuthPage.tsx` and Axios client bindings in `frontend/src/api/auth.ts`

**Checkpoint**: User Story 1 (Google SSO) is fully functional and testable independently

---

## Phase 4: User Story 2 - Email Registration, Verification & Automatic Login (Priority: P1)

**Goal**: Account creation with unverified flag, dispatching link, and automatic authentication on click

**Independent Test**: Register with a new email, open Mailpit sandbox, click verification link, verify instant dashboard login.

- [x] T013 [P] [US2] Update verification schemas in `backend/app/schemas/auth.py`
- [x] T014 [US2] Extend signup service to generate verification tokens and trigger email dispatches in `backend/app/services/auth_service.py`
- [x] T015 [US2] Expose verification token callback route `/auth/verify` in `backend/app/api/v1/auth.py`
- [x] T016 [P] [US2] Create landing page with auto-login API lookup in `frontend/src/pages/VerifyEmailPage.tsx`
- [x] T017 [US2] Add visual verification route mapping in React routing configuration in `frontend/src/App.tsx`

**Checkpoint**: User Story 2 (Email Verification) is fully functional and testable independently

---

## Phase 5: User Story 3 - Unified Login/Register Screen & Password Check (Priority: P1)

**Goal**: Single unified dynamic landing page for registration and login

**Independent Test**: Enter an existing email and enter password, enter a new email to set a new password.

- [x] T018 [US3] Add email existence check endpoint `/auth/access` in `backend/app/api/v1/auth.py`
- [x] T019 [US3] Add unified register/login dispatch endpoint `/auth/register-login` in `backend/app/api/v1/auth.py`
- [x] T020 [US3] Update auth page layout to dynamically toggle login/signup flows in `frontend/src/pages/AuthPage.tsx`

**Checkpoint**: User Story 3 (Unified Screen) is fully functional and testable independently

---

## Phase 6: User Story 4 - Forgot Password Recovery (Priority: P2)

**Goal**: Request recovery link via email, click link to land on reset screen, and update password

**Independent Test**: Request password reset, check Mailpit sandbox, click link, enter new password, log in successfully with new password.

- [x] T021 [US4] Extend auth service to generate password reset tokens and send reset email in `backend/app/services/auth_service.py`
- [x] T022 [US4] Expose forgot and reset endpoints `/auth/forgot-password` and `/auth/reset-password` in `backend/app/api/v1/auth.py`
- [x] T023 [P] [US4] Create password reset landing page form in `frontend/src/pages/ResetPasswordPage.tsx`
- [x] T024 [US4] Add reset routing configuration in `frontend/src/App.tsx` and Axios triggers in `frontend/src/api/auth.ts`

**Checkpoint**: User Story 4 (Forgot Password) is fully functional and testable independently

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Visual optimizations, test suites, and OpenAPI documentation

- [ ] T025 [P] Update OpenAPI specifications and developer documentation in `README.md`
- [ ] T026 Write comprehensive backend integration test suite in `backend/app/tests/test_auth.py` covering SSO, email verification, and resets
- [ ] T027 Run full test suite and verify Traefik routing rules
- [ ] T028 Apply premium glassmorphism styling tokens and transition animations in CSS `frontend/src/index.css`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion. Blocks all user stories.
- **User Stories (Phases 3 to 6)**: Depend on Foundational completion.
- **Polish (Phase 7)**: Depends on all user stories being complete.

### Parallel Opportunities

- Foundational tasks (T003, T004, T005, T006) can run in parallel.
- Google SSO tasks (T007, T010, T011) can run in parallel.
- Email verification tasks (T013, T016) can run in parallel.
- Forgot password tasks (T023) can run in parallel.
- Once Foundation is complete, work on US1, US2, and US4 can proceed in parallel (if different files are touched).

---

## Parallel Example: User Story 1

```bash
# Launch Google SSO backend and frontend setup together:
Task: "Implement Google SSO schemas in backend/app/schemas/auth.py"
Task: "Build Google SSO brand button in frontend/src/components/GoogleSsoButton.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (Mailpit container initialization).
2. Complete Phase 2: Foundational (Database migrations, models, core mailer).
3. Complete Phase 3: User Story 1 (Google SSO integration).
4. **STOP and VALIDATE**: Verify mock Google SSO login flow.

### Incremental Delivery

1. Setup + Foundation -> DB & Mailer ready.
2. User Story 1 -> Mock Google SSO active (One-click Login / MVP).
3. User Story 2 -> Email verification active.
4. User Story 3 -> Unified login/register visual screen active.
5. User Story 4 -> Forgot password reset flows active.
6. Phase 7 -> Run tests, polish stylesheets.
