"""merge migration branches

Revision ID: 562893e38854
Revises: d212af8da78a, fix_music_table
Create Date: 2025-06-05 13:49:29.838633

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '562893e38854'
down_revision = ('d212af8da78a', 'fix_music_table')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
