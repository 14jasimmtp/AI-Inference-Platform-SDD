---
description: "Task list template for feature implementation"
---

# Tasks: Phase-2 Multi-tenancy & Admin UI

**Input**: Design documents from `/specs/002-multi-tenancy-admin-ui/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Verify and clean existing database schema matching Phase 1 constraints in `backend/app/models/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 [P] Implement explicit `UserRole` Enum and role hierarchy in `backend/app/core/permissions.py`
- [X] T003 Implement `require_role`, `require_min_role`, and `assert_same_org` dependency injection helpers in `backend/app/core/permissions.py`
- [X] T004 [P] Create organisation Pydantic schemas (`OrgCreateRequest`, `OrgUpdateRequest`, `OrgResponse`, `OrgDetailResponse`) in `backend/app/schemas/org.py`
- [X] T005 [P] Update user Pydantic schemas (`InviteUserRequest`, `InviteResponse`, `OrgUserResponse`, `UpdateRoleRequest`) in `backend/app/schemas/user.py`
- [X] T006 [P] Update API key Pydantic schemas (`ApiKeyCreateRequest`, `ApiKeyCreatedResponse`, `ApiKeyListItem`, `ApiKeyRotateResponse`) in `backend/app/schemas/api_key.py`

**Checkpoint**: Foundation ready - RBAC rules and validation schemas are established.

---

## Phase 3: User Story 1 - Organisation CRUD and Isolation (Priority: P1) 🎯 MVP

**Goal**: Establish isolated organisations managed by super_admin and org_admin.

**Independent Test**: Can be verified by creating an organisation and attempting to fetch it using different user roles.

### Tests for User Story 1 (OPTIONAL) ⚠️

- [ ] T007 [P] [US1] Create integration tests for organisation CRUD and isolation in `backend/tests/test_orgs.py`

### Implementation for User Story 1

- [X] T008 [US1] Implement core service methods (`create_org`, `get_org`, `list_orgs`, `update_org`, `delete_org`, `get_org_stats`) in `backend/app/services/org_service.py`
- [X] T009 [US1] Implement FastAPI routes (`POST /orgs`, `GET /orgs`, `GET /orgs/{org_id}`, `PUT /orgs/{org_id}`, `DELETE /orgs/{org_id}`) in `backend/app/api/v1/orgs.py`
- [X] T010 [US1] Register the `orgs` router in `backend/app/api/router.py`

**Checkpoint**: Organisation CRUD operations and isolation logic should be fully functional.

---

## Phase 4: User Story 2 - User Invite and Role Assignment (Priority: P1)

**Goal**: Allow org_admins to invite users, assign roles, and remove users within their own organisation.

**Independent Test**: Can be tested by inviting a user and verifying cross-org role assignments are rejected.

### Tests for User Story 2 (OPTIONAL) ⚠️

- [ ] T011 [P] [US2] Create integration tests for user invites and role assignments in `backend/tests/test_users.py`

### Implementation for User Story 2

- [X] T012 [US2] Implement user service methods (`invite_user`, `get_org_users`, `update_user_role`, `remove_user_from_org`) in `backend/app/services/user_service.py`
- [X] T013 [US2] Implement FastAPI routes (`POST /orgs/{org_id}/invite`, `GET /orgs/{org_id}/users`, `PATCH /orgs/{org_id}/users/{user_id}`, `DELETE /orgs/{org_id}/users/{user_id}`) in `backend/app/api/v1/users.py`
- [X] T014 [US2] Register the `users` router in `backend/app/api/router.py`

**Checkpoint**: User invitation and role-based lifecycle within organisations should be fully functional.

---

## Phase 5: User Story 3 - Role-Scoped API Key Management (Priority: P2)

**Goal**: Enable creation and management of API keys scoped by the user's role and organisation.

**Independent Test**: Can be tested by having an org_admin list all org keys while a regular user can only list their own.

### Tests for User Story 3 (OPTIONAL) ⚠️

- [ ] T015 [P] [US3] Update integration tests for role-scoped API key management in `backend/tests/test_api_keys.py`

### Implementation for User Story 3

- [X] T016 [US3] Implement `assert_can_manage_key` security check in `backend/app/core/permissions.py`
- [X] T017 [US3] Update api key service methods (`create_api_key`, `list_keys`, `rotate_key`, `revoke_key`) ensuring cascade revocation in `backend/app/services/api_key_service.py`
- [X] T018 [US3] Implement FastAPI routes (`POST /api-keys`, `GET /api-keys`, `POST /api-keys/{key_id}/rotate`, `DELETE /api-keys/{key_id}`) in `backend/app/api/v1/api_keys.py`

**Checkpoint**: All user stories should now be independently functional. API keys securely bind to roles.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T019 Check all endpoints for strict standard response envelope compliance (`ok(data)` / `error_response(...)`).
- [X] T020 Run the full pytest suite (`tests/test_orgs.py`, `tests/test_users.py`, `tests/test_api_keys.py`) to confirm no regressions.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1, US2, and US3 can proceed in parallel once the RBAC helpers and schemas are created.
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent.
- **User Story 2 (P1)**: Independent, but conceptually relies on Org creation.
- **User Story 3 (P2)**: Independent, but conceptually relies on Users and Orgs existing.

### Parallel Opportunities

- Foundation tasks T004, T005, T006 can run in parallel.
- Test creation tasks T007, T011, T015 can run in parallel.
- Services T008, T012, T017 can be implemented in parallel across developers once foundational schemas and DB models are ready.
