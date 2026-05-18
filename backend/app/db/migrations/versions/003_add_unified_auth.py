"""add unified auth columns

Revision ID: 003_add_unified_auth
Revises: 843b6cacbbcc
Create Date: 2026-05-18 12:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003_add_unified_auth'
down_revision: Union[str, Sequence[str], None] = '843b6cacbbcc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
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


def downgrade() -> None:
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
