"""add storyboard and media

Revision ID: e3f5h7i9j1k3
Revises: d2e4f6g8h0i2
Create Date: 2024-01-29 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'e3f5h7i9j1k3'
down_revision = 'd2e4f6g8h0i2'
branch_labels = None
depends_on = None

def upgrade():
    # Create storyboards table
    op.create_table(
        'storyboards',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('universe_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.String(length=1000)),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['universe_id'], ['universes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_storyboards_universe_id', 'storyboards', ['universe_id'])
    op.create_index('idx_storyboards_created_at', 'storyboards', ['created_at'])

    # Create scenes table
    op.create_table(
        'scenes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('storyboard_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('sequence', sa.Integer(), nullable=False),
        sa.Column('content', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['storyboard_id'], ['storyboards.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_scenes_storyboard_id', 'scenes', ['storyboard_id'])
    op.create_index('idx_scenes_sequence', 'scenes', ['sequence'])

    # Create visual_effects table
    op.create_table(
        'visual_effects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('scene_id', sa.Integer(), nullable=False),
        sa.Column('effect_type', sa.String(length=50), nullable=False),
        sa.Column('parameters', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('start_time', sa.Float(), nullable=False),
        sa.Column('duration', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['scene_id'], ['scenes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_visual_effects_scene_id', 'visual_effects', ['scene_id'])
    op.create_index('idx_visual_effects_type', 'visual_effects', ['effect_type'])

    # Create audio_tracks table
    op.create_table(
        'audio_tracks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('scene_id', sa.Integer(), nullable=False),
        sa.Column('track_type', sa.String(length=50), nullable=False),
        sa.Column('parameters', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('start_time', sa.Float(), nullable=False),
        sa.Column('duration', sa.Float(), nullable=False),
        sa.Column('volume', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['scene_id'], ['scenes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_audio_tracks_scene_id', 'audio_tracks', ['scene_id'])
    op.create_index('idx_audio_tracks_type', 'audio_tracks', ['track_type'])

def downgrade():
    # Drop tables in reverse order
    op.drop_table('audio_tracks')
    op.drop_table('visual_effects')
    op.drop_table('scenes')
    op.drop_table('storyboards')
