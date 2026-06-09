"""add rate_limit_rpm

Revision ID: d41e20fe1234
Revises: 003_add_unified_auth
Create Date: 2026-06-08 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd41e20fe1234'
down_revision: Union[str, Sequence[str], None] = '003_add_unified_auth'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('organisations', sa.Column('rate_limit_rpm', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('rate_limit_rpm', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'rate_limit_rpm')
    op.drop_column('organisations', 'rate_limit_rpm')
