# Database Schema & Migrations: Unified Authentication

This document details the schema changes and migration steps required to implement unified login, email verification, and password recovery.

---

## 1. Schema Extensions: `users` Table

We will add the following columns to the existing `users` table:

| Column Name | Type | Nullable | Default | Notes |
|-------------|------|----------|---------|-------|
| `is_verified` | BOOLEAN | NOT NULL | `false` | Blocked from API key creation if false |
| `verification_token` | VARCHAR(255) | Yes | `NULL` | Cryptographically random verification UUID |
| `verification_sent_at`| TIMESTAMP WITH TZ | Yes | `NULL` | Used to calculate token expiration (24h) |
| `reset_token` | VARCHAR(255) | Yes | `NULL` | Cryptographically random password reset UUID |
| `reset_expires_at` | TIMESTAMP WITH TZ | Yes | `NULL` | Used to calculate token expiration (1h) |
| `google_sso_id` | VARCHAR(255) | Yes | `NULL` | Identifier linked to simulated Google identities |

---

## 2. Database Indexes

To prevent sequential table scans during verification or password resets, the following index definitions must be created:

```sql
-- Fast lookup during email verification clicks
CREATE INDEX idx_users_verification_token ON users(verification_token) WHERE verification_token IS NOT NULL;

-- Fast lookup during password reset requests
CREATE INDEX idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;

-- Fast lookup during Google SSO clicks
CREATE UNIQUE INDEX idx_users_google_sso ON users(google_sso_id) WHERE google_sso_id IS NOT NULL;
```

---

## 3. Alembic Migration Rules

Alembic will automatically handle these schema extensions. The migration script must perform the following actions inside a secure transaction block:

```python
"""add unified auth columns

Revision ID: 003_add_unified_auth
Revises: 002_multi_tenancy
Create Date: 2026-05-18 12:30:00.000000
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # 1. Add columns to users table
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('verification_token', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('verification_sent_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('reset_token', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('reset_expires_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('google_sso_id', sa.String(length=255), nullable=True))
    
    # 2. Create optimized indexes
    op.create_index('idx_users_verification_token', 'users', ['verification_token'], unique=False, postgresql_where=sa.text('verification_token IS NOT NULL'))
    op.create_index('idx_users_reset_token', 'users', ['reset_token'], unique=False, postgresql_where=sa.text('reset_token IS NOT NULL'))
    op.create_index('idx_users_google_sso', 'users', ['google_sso_id'], unique=True, postgresql_where=sa.text('google_sso_id IS NOT NULL'))

def downgrade():
    # 1. Drop indexes
    op.drop_index('idx_users_google_sso', table_name='users')
    op.drop_index('idx_users_reset_token', table_name='users')
    op.drop_index('idx_users_verification_token', table_name='users')
    
    # 2. Drop columns
    op.drop_column('users', 'google_sso_id')
    op.drop_column('users', 'reset_expires_at')
    op.drop_column('users', 'reset_token')
    op.drop_column('users', 'verification_sent_at')
    op.drop_column('users', 'verification_token')
    op.drop_column('users', 'is_verified')
```
