"""add_user_name_zip_codes_to_users

Revision ID: 3a5cf7eb4935
Revises: 516e1fc0ee11
Create Date: 2026-04-30 11:54:14.238335

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '3a5cf7eb4935'
down_revision: Union[str, Sequence[str], None] = '516e1fc0ee11'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_columns = {col['name'] for col in inspector.get_columns('users')}

    if 'user_name' not in existing_columns:
        op.add_column('users', sa.Column('user_name', sa.String(), nullable=True))
    if 'zip_code_1' not in existing_columns:
        op.add_column('users', sa.Column('zip_code_1', sa.String(), nullable=True))
    if 'zip_code_2' not in existing_columns:
        op.add_column('users', sa.Column('zip_code_2', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_columns = {col['name'] for col in inspector.get_columns('users')}

    if 'zip_code_2' in existing_columns:
        op.drop_column('users', 'zip_code_2')
    if 'zip_code_1' in existing_columns:
        op.drop_column('users', 'zip_code_1')
    if 'user_name' in existing_columns:
        op.drop_column('users', 'user_name')
