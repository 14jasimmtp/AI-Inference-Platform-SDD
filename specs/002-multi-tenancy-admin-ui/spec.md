# Feature Specification: Phase-2: Multi-tenancy & Admin UI

**Feature Branch**: `002-multi-tenancy-admin-ui`  
**Created**: 2026-05-14  
**Status**: Draft  

## Clarifications

### Session 2026-05-14
- Q: When a user is removed from an organization, what should automatically happen to their active API keys? → A: Automatically revoke all active API keys owned by the user.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Organisation CRUD and Isolation (Priority: P1)

As a Super Admin, I want to create and manage multiple organisations so that different customers or teams can use the platform securely. As an Org Admin, I want to view and manage my own organisation's details but be prevented from accessing any other organisation.

**Why this priority**: Establishing hard isolation boundaries between organisations is the foundation of multi-tenancy. Everything else builds on top of this.

**Independent Test**: Can be fully tested by creating two organisations, ensuring super_admin can see both, and verifying that an org_admin in Org A receives a 403 Forbidden when attempting to access Org B.

**Acceptance Scenarios**:

1. **Given** a super_admin, **When** they create a new organisation via `POST /orgs`, **Then** the organisation is created and returned with an `org_id`.
2. **Given** an org_admin of Org A, **When** they try to `GET /orgs/{org_b_id}`, **Then** the system returns a 403 error.
3. **Given** a super_admin, **When** they delete an organisation that has active users, **Then** the system returns a 409 Conflict.

---

### User Story 2 - User Invite and Role Assignment (Priority: P1)

As an Org Admin, I want to invite new users to my organisation and assign them specific roles (team_lead, user) so that I can delegate responsibilities. I should not be able to assign the super_admin role.

**Why this priority**: Role-based access control within an organisation allows customers to manage their own users without contacting platform support.

**Independent Test**: Can be tested by having an org_admin invite a new user, change their role to team_lead, and verify that the org_admin cannot invite a user to a different organisation.

**Acceptance Scenarios**:

1. **Given** an org_admin, **When** they invite a user via `POST /orgs/{org_id}/invite`, **Then** an invite is created with the requested role (e.g., team_lead).
2. **Given** an org_admin, **When** they attempt to assign the "super_admin" role, **Then** the system rejects the request with a 422 or 400 error.
3. **Given** a team_lead or regular user, **When** they try to invite a user, **Then** the system returns a 403 Forbidden.

---

### User Story 3 - Role-Scoped API Key Management (Priority: P2)

As a user, team lead, or org admin, I want to create and manage API keys with scopes limited by my role, so that I can programmatically access the inference platform securely.

**Why this priority**: API access is the primary use case for an inference platform. Generating and revoking keys securely ensures usage can be tracked and compromised keys can be revoked.

**Independent Test**: Can be tested by creating keys as different roles and attempting to view/revoke them. An org_admin should see all keys in their org, a team_lead sees all keys in their org (for now), and a regular user only sees their own.

**Acceptance Scenarios**:

1. **Given** a regular user, **When** they create an API key, **Then** the key is created, the plaintext is shown once, and it is scoped to their account.
2. **Given** a regular user, **When** they try to revoke another user's key, **Then** the system returns a 403 Forbidden.
3. **Given** an org_admin, **When** they list API keys, **Then** they see all keys created by any user within their organisation.

---

### Edge Cases

- What happens when a user attempts to remove themselves from an organisation? (Should return 400 Bad Request).
- What happens when a user is successfully removed from an organisation? (The system automatically revokes all active API keys owned by that user).
- What happens if someone tries to create an organisation with a slug that already exists? (Should return 409 Conflict).
- What happens if a key is rotated? (The old key must be completely unusable, and a new plaintext key is generated and returned exactly once).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support four explicit roles: `super_admin`, `org_admin`, `team_lead`, and `user`.
- **FR-002**: System MUST completely isolate organisations; cross-organisation access by anyone other than `super_admin` MUST return 403.
- **FR-003**: System MUST provide Organisation CRUD endpoints (`POST /orgs`, `GET /orgs`, `GET /orgs/{id}`, `PUT /orgs/{id}`, `DELETE /orgs/{id}`).
- **FR-004**: System MUST allow `org_admin` to invite, role-update, and remove users within their own organisation.
- **FR-005**: System MUST enforce role assignment hierarchy: `super_admin` can assign `org_admin`/`team_lead`/`user`; `org_admin` can assign `team_lead`/`user`.
- **FR-006**: System MUST ensure API keys are stored as SHA-256 hashes only and the plaintext is returned exactly once on creation/rotation.
- **FR-007**: System MUST scope API key visibility and management based on role: `user` (own only), `team_lead`/`org_admin` (own org only).
- **FR-008**: System MUST perform RBAC enforcement strictly via `Depends(require_role(...))` and `Depends(require_min_role(...))` combined with an `assert_same_org()` check, rather than inline conditionals in route bodies.
- **FR-009**: System MUST return standard envelopes (`ok(data)`, `error_response(...)`) for all responses.
- **FR-010**: System MUST NOT allow creation of a `super_admin` via the API; they can only be seeded via CLI/DB.

### Key Entities

- **Organisation**: Represents a tenant. Attributes: `org_id`, `name`, `slug`, `is_active`.
- **User**: Represents an individual account. Attributes: `user_id`, `email`, `role`, `org_id`.
- **API Key**: Represents programmatic access credentials. Attributes: `key_id`, `name`, `prefix`, `user_id`, `org_id`, `rate_limit_rpm`, hashed key value.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the provided `pytest` integration tests (`test_orgs.py`, `test_users.py`, `test_api_keys.py`) pass without any modifications to the test expectations.
- **SC-002**: 0 instances of inline `if user.role == ...` checks exist within the `/api/v1/` route handler functions (all logic is delegated to `permissions.py` and service layers).
- **SC-003**: 0 instances of raw database queries (`db.execute(...)`) exist in the route handlers.
- **SC-004**: 100% of endpoints return the correct standard JSON envelope.

## Assumptions

- Database schema and Alembic migrations from Phase 1 already support the necessary columns (`org_id`, `role`, etc.) or they are implicitly managed without needing new tables (as explicitly stated in constraints: no new tables, no new migrations).
- Team scoping for `team_lead` acts as organisation-wide scoping for Phase 2/3, with sub-teams planned for Phase 4.
- `super_admin` users belong to a system-level state or their `org_id` restrictions are bypassed programmatically.
- No UI components are required to be built for these administrative features in this phase.
