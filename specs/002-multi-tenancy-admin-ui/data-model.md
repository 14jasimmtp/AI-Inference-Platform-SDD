# Data Model: Phase-2 Multi-tenancy & Admin UI

This document maps the entities required for Phase 2 based on the project constitution and the feature specification.

> **Constraint Note:** As mandated by the spec, no new tables or Alembic migrations are generated in this phase. The data structures are natively mapped to existing columns as defined in Phase 1 constraints.

## Entities

### 1. Organisation
Represents a tenant in the multi-tenant architecture.

*   **id (UUID)**: Primary Key.
*   **name (VARCHAR 255)**: Display name.
*   **slug (VARCHAR 100)**: URL-safe unique identifier.
*   **is_active (BOOLEAN)**: Soft-delete/suspension flag. Default: true.
*   **created_at (TIMESTAMP)**
*   **updated_at (TIMESTAMP)**

**Validation Rules:**
*   `slug` must match `^[a-z0-9-]+$` and be globally unique.
*   Organisation deletion requires verification that `active_users` is 0, raising `ConflictError` if violated.

### 2. User
Represents an individual account belonging to exactly one organisation.

*   **id (UUID)**: Primary Key.
*   **org_id (UUID)**: Foreign Key to `organisations.id`. Cannot be reassigned.
*   **email (VARCHAR 320)**: Unique login identifier.
*   **role (Enum)**: `super_admin`, `org_admin`, `team_lead`, `user`.
*   **full_name (VARCHAR 255)**
*   **password_hash (VARCHAR 255)**: bcrypt hashed password.
*   **is_active (BOOLEAN)**: Default: true.

**Validation Rules:**
*   A user can hold exactly one role.
*   Users with `role == super_admin` bypass org isolation restrictions.
*   Cannot invite or change roles to `super_admin` via API.

### 3. API Key
Represents programmatic access credentials.

*   **id (UUID)**: Primary Key.
*   **user_id (UUID)**: Foreign Key to `users.id`. `ON DELETE CASCADE` (Or cascade revoke handled at service layer).
*   **org_id (UUID)**: Foreign Key to `organisations.id`. Denormalized for fast scoping.
*   **name (VARCHAR 255)**: Human-readable label.
*   **key_hash (CHAR 64)**: SHA-256 hex string of the full token. Unique.
*   **key_prefix (VARCHAR 12)**: The first 7 chars of the token for display purposes.
*   **is_active (BOOLEAN)**: Default: true. Set to false when revoked.
*   **rate_limit_rpm (INTEGER)**: Token bucket capacity. Default: 60.
*   **expires_at (TIMESTAMP)**: Nullable.

**Validation Rules:**
*   API keys must be securely hashed prior to database insertion; the plaintext `sk-abc...` is never persisted.
*   Role-scoping applies on creation, viewing, and revoking.
*   When a user is removed from their organisation, all active API keys associated with their `user_id` must be automatically set to `is_active = false` and `revoked_at` populated.
