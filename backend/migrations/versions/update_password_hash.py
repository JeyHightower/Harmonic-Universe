"""update password hash length

Revision ID: update_password_hash
Revises: d374b63eb196
Create Date: 2025-04-16 05:40:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e4b5f7c8a9b0'  # Using a proper hex format for revision ID
down_revision = 'd374b63eb196'
branch_labels = None
depends_on = None


def upgrade():
    # Update password_hash column to VARCHAR(255)
    op.alter_column('users', 'password_hash',
               existing_type=sa.VARCHAR(length=128),
               type_=sa.VARCHAR(length=255),
               existing_nullable=True)


def downgrade():
    # Revert back to VARCHAR(128)
    op.alter_column('users', 'password_hash',
               existing_type=sa.VARCHAR(length=255),
               type_=sa.VARCHAR(length=128),
               existing_nullable=True) 