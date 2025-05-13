"""Fix Music table to use SQLAlchemy 2.0 style

Revision ID: fix_music_table
Revises: 
Create Date: 2023-05-13

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic
revision = 'fix_music_table'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create music table if it doesn't exist
    if not op.get_bind().dialect.has_table(op.get_bind(), 'music'):
        op.create_table('music',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.Column('is_deleted', sa.Boolean(), nullable=True),
            sa.Column('name', sa.String(length=100), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('universe_id', sa.Integer(), nullable=False),
            sa.Column('scene_id', sa.Integer(), nullable=True),
            sa.Column('music_data', sa.JSON(), nullable=False),
            sa.Column('algorithm', sa.String(length=50), nullable=True),
            sa.Column('tempo', sa.Integer(), nullable=True),
            sa.Column('key', sa.String(length=10), nullable=True),
            sa.Column('scale', sa.String(length=20), nullable=True),
            sa.Column('parameters', sa.JSON(), nullable=True),
            sa.Column('audio_url', sa.String(length=255), nullable=True),
            sa.ForeignKeyConstraint(['scene_id'], ['scenes.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['universe_id'], ['universes.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_music_name'), 'music', ['name'], unique=False)
        op.create_index(op.f('ix_music_scene_id'), 'music', ['scene_id'], unique=False)
        op.create_index(op.f('ix_music_universe_id'), 'music', ['universe_id'], unique=False)
        op.create_index(op.f('ix_music_user_id'), 'music', ['user_id'], unique=False)

def downgrade():
    # Drop music table if it exists
    op.drop_index(op.f('ix_music_user_id'), table_name='music')
    op.drop_index(op.f('ix_music_universe_id'), table_name='music')
    op.drop_index(op.f('ix_music_scene_id'), table_name='music')
    op.drop_index(op.f('ix_music_name'), table_name='music')
    op.drop_table('music')
