"""create analytics table

Revision ID: create_analytics_table
Revises:
Create Date: 2024-03-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic
revision = 'create_analytics_table'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'analytics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('metric_name', sa.String(length=100), nullable=False),
        sa.Column('metric_value', sa.Float(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('tags', JSONB(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index(
        'ix_analytics_metric_name',
        'analytics',
        ['metric_name'],
        unique=False
    )
    op.create_index(
        'ix_analytics_timestamp',
        'analytics',
        ['timestamp'],
        unique=False
    )

    # Create GIN index for JSONB tags
    op.execute(
        'CREATE INDEX ix_analytics_tags ON analytics USING gin (tags jsonb_path_ops)'
    )

def downgrade():
    # Drop indexes
    op.drop_index('ix_analytics_tags', table_name='analytics')
    op.drop_index('ix_analytics_timestamp', table_name='analytics')
    op.drop_index('ix_analytics_metric_name', table_name='analytics')

    # Drop table
    op.drop_table('analytics')
