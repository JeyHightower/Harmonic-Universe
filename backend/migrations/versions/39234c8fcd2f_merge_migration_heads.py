"""merge migration heads

Revision ID: 39234c8fcd2f
Revises: 562893e38854, 671606b72edd
Create Date: 2025-06-27 01:23:50.076793

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '39234c8fcd2f'
down_revision = ('562893e38854', '671606b72edd')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
