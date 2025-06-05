"""Fix Music table to use SQLAlchemy 2.0 style

Revision ID: fix_music_table
Revises:
Create Date: 2023-05-13

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect

# revision identifiers, used by Alembic
revision = 'fix_music_table'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create music table if it doesn't exist
    bind = op.get_bind()
    inspector = inspect(bind)
    if not inspector.has_table('music'):
        op.create_table('music',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.Column('is_deleted', sa.Boolean(), nullable=True),
            sa.Column('name', sa.String(length=255), nullable=True),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('universe_id', sa.Integer(), nullable=True),
            sa.Column('scene_id', sa.Integer(), nullable=True),
            sa.Column('music_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column('algorithm', sa.String(length=255), nullable=True),
            sa.Column('tempo', sa.Integer(), nullable=True),
            sa.Column('key', sa.String(length=255), nullable=True),
            sa.Column('scale', sa.String(length=255), nullable=True),
            sa.Column('parameters', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column('audio_url', sa.String(length=255), nullable=True),
            sa.ForeignKeyConstraint(['scene_id'], ['scenes.id'], ),
            sa.ForeignKeyConstraint(['universe_id'], ['universes.id'], ),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_music_name'), 'music', ['name'], unique=False)
        op.create_index(op.f('ix_music_scene_id'), 'music', ['scene_id'], unique=False)
        op.create_index(op.f('ix_music_universe_id'), 'music', ['universe_id'], unique=False)
        op.create_index(op.f('ix_music_user_id'), 'music', ['user_id'], unique=False)

def downgrade():
    op.drop_index(op.f('ix_music_user_id'), table_name='music')
    op.drop_index(op.f('ix_music_universe_id'), table_name='music')
    op.drop_index(op.f('ix_music_scene_id'), table_name='music')
    op.drop_index(op.f('ix_music_name'), table_name='music')
    op.drop_table('music')
