"""create initial tables

Revision ID: 5da119559737
Revises:
Create Date: 2025-05-12 19:48:47.190294

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5da119559737'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create users table first since it's referenced by other tables
    op.create_table('users',
        sa.Column('username', sa.String(length=80), nullable=False),
        sa.Column('email', sa.String(length=120), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=True),
        sa.Column('version', sa.Integer(), nullable=False),
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_users_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_users_email'), ['email'], unique=True)
        batch_op.create_index(batch_op.f('ix_users_is_deleted'), ['is_deleted'], unique=False)
        batch_op.create_index(batch_op.f('ix_users_updated_at'), ['updated_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_users_username'), ['username'], unique=True)

    # Create universes table next
    op.create_table('universes',
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('sound_profile_id', sa.Integer(), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False),
        sa.Column('genre', sa.String(length=100), nullable=True),
        sa.Column('theme', sa.String(length=100), nullable=True),
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('universes', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_universes_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_universes_is_deleted'), ['is_deleted'], unique=False)
        batch_op.create_index(batch_op.f('ix_universes_name'), ['name'], unique=False)
        batch_op.create_index(batch_op.f('ix_universes_sound_profile_id'), ['sound_profile_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_universes_updated_at'), ['updated_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_universes_user_id'), ['user_id'], unique=False)

    # Create scenes table without foreign key constraints
    op.create_table('scenes',
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('notes_text', sa.Text(), nullable=True),
        sa.Column('location', sa.String(length=200), nullable=True),
        sa.Column('scene_type', sa.String(length=50), nullable=True),
        sa.Column('time_of_day', sa.String(length=50), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('significance', sa.String(length=50), nullable=True),
        sa.Column('date_of_scene', sa.String(length=50), nullable=True),
        sa.Column('order', sa.Integer(), nullable=True),
        sa.Column('universe_id', sa.Integer(), nullable=False),
        sa.Column('sound_profile_id', sa.Integer(), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False),
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('scenes', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_scenes_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_scenes_is_deleted'), ['is_deleted'], unique=False)
        batch_op.create_index(batch_op.f('ix_scenes_name'), ['name'], unique=False)
        batch_op.create_index(batch_op.f('ix_scenes_sound_profile_id'), ['sound_profile_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_scenes_universe_id'), ['universe_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_scenes_updated_at'), ['updated_at'], unique=False)

    # Create sound_profiles table without foreign key constraints
    op.create_table('sound_profiles',
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('universe_id', sa.Integer(), nullable=True),
        sa.Column('scene_id', sa.Integer(), nullable=True),
        sa.Column('ambient_volume', sa.Float(), nullable=False),
        sa.Column('music_volume', sa.Float(), nullable=False),
        sa.Column('effects_volume', sa.Float(), nullable=False),
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('sound_profiles', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_sound_profiles_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_sound_profiles_is_deleted'), ['is_deleted'], unique=False)
        batch_op.create_index(batch_op.f('ix_sound_profiles_name'), ['name'], unique=False)
        batch_op.create_index(batch_op.f('ix_sound_profiles_scene_id'), ['scene_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_sound_profiles_universe_id'), ['universe_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_sound_profiles_updated_at'), ['updated_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_sound_profiles_user_id'), ['user_id'], unique=False)

    # Now add foreign key constraints
    op.create_foreign_key('fk_universes_user_id', 'universes', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_scenes_universe_id', 'scenes', 'universes', ['universe_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_sound_profiles_user_id', 'sound_profiles', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_sound_profiles_universe_id', 'sound_profiles', 'universes', ['universe_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_universes_sound_profile_id', 'universes', 'sound_profiles', ['sound_profile_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key('fk_scenes_sound_profile_id', 'scenes', 'sound_profiles', ['sound_profile_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key('fk_sound_profiles_scene_id', 'sound_profiles', 'scenes', ['scene_id'], ['id'], ondelete='CASCADE')

    # Create remaining tables
    op.create_table('audio_samples',
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('file_path', sa.String(length=255), nullable=False),
        sa.Column('duration', sa.Float(), nullable=True),
        sa.Column('sample_rate', sa.Integer(), nullable=True),
        sa.Column('channels', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('sound_profile_id', sa.Integer(), nullable=True),
        sa.Column('universe_id', sa.Integer(), nullable=True),
        sa.Column('scene_id', sa.Integer(), nullable=True),
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('audio_samples', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_audio_samples_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_audio_samples_is_deleted'), ['is_deleted'], unique=False)
        batch_op.create_index(batch_op.f('ix_audio_samples_name'), ['name'], unique=False)
        batch_op.create_index(batch_op.f('ix_audio_samples_scene_id'), ['scene_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_audio_samples_sound_profile_id'), ['sound_profile_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_audio_samples_universe_id'), ['universe_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_audio_samples_updated_at'), ['updated_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_audio_samples_user_id'), ['user_id'], unique=False)

    op.create_table('characters',
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('universe_id', sa.Integer(), nullable=False),
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('characters', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_characters_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_characters_is_deleted'), ['is_deleted'], unique=False)
        batch_op.create_index(batch_op.f('ix_characters_universe_id'), ['universe_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_characters_updated_at'), ['updated_at'], unique=False)

    op.create_table('music',
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
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('music', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_music_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_music_is_deleted'), ['is_deleted'], unique=False)
        batch_op.create_index(batch_op.f('ix_music_name'), ['name'], unique=False)
        batch_op.create_index(batch_op.f('ix_music_scene_id'), ['scene_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_music_universe_id'), ['universe_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_music_updated_at'), ['updated_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_music_user_id'), ['user_id'], unique=False)

    op.create_table('music_pieces',
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('file_path', sa.String(length=255), nullable=False),
        sa.Column('duration', sa.Float(), nullable=True),
        sa.Column('tempo', sa.Integer(), nullable=True),
        sa.Column('key', sa.String(length=10), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('sound_profile_id', sa.Integer(), nullable=True),
        sa.Column('universe_id', sa.Integer(), nullable=True),
        sa.Column('scene_id', sa.Integer(), nullable=True),
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('music_pieces', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_music_pieces_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_music_pieces_is_deleted'), ['is_deleted'], unique=False)
        batch_op.create_index(batch_op.f('ix_music_pieces_name'), ['name'], unique=False)
        batch_op.create_index(batch_op.f('ix_music_pieces_scene_id'), ['scene_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_music_pieces_sound_profile_id'), ['sound_profile_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_music_pieces_universe_id'), ['universe_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_music_pieces_updated_at'), ['updated_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_music_pieces_user_id'), ['user_id'], unique=False)

    op.create_table('physics_2d',
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('universe_id', sa.Integer(), nullable=False),
        sa.Column('scene_id', sa.Integer(), nullable=True),
        sa.Column('gravity_x', sa.Float(), nullable=False),
        sa.Column('gravity_y', sa.Float(), nullable=False),
        sa.Column('allow_sleep', sa.Boolean(), nullable=False),
        sa.Column('warm_starting', sa.Boolean(), nullable=False),
        sa.Column('continuous_physics', sa.Boolean(), nullable=False),
        sa.Column('sub_stepping', sa.Boolean(), nullable=False),
        sa.Column('velocity_iterations', sa.Integer(), nullable=False),
        sa.Column('position_iterations', sa.Integer(), nullable=False),
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('physics_2d', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_physics_2d_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_2d_is_deleted'), ['is_deleted'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_2d_scene_id'), ['scene_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_2d_universe_id'), ['universe_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_2d_updated_at'), ['updated_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_2d_user_id'), ['user_id'], unique=False)

    # Add remaining foreign key constraints
    op.create_foreign_key('fk_audio_samples_user_id', 'audio_samples', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_audio_samples_sound_profile_id', 'audio_samples', 'sound_profiles', ['sound_profile_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_audio_samples_universe_id', 'audio_samples', 'universes', ['universe_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_audio_samples_scene_id', 'audio_samples', 'scenes', ['scene_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_characters_universe_id', 'characters', 'universes', ['universe_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_music_user_id', 'music', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_music_universe_id', 'music', 'universes', ['universe_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_music_scene_id', 'music', 'scenes', ['scene_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_music_pieces_user_id', 'music_pieces', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_music_pieces_sound_profile_id', 'music_pieces', 'sound_profiles', ['sound_profile_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_music_pieces_universe_id', 'music_pieces', 'universes', ['universe_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_music_pieces_scene_id', 'music_pieces', 'scenes', ['scene_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_physics_2d_user_id', 'physics_2d', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_physics_2d_universe_id', 'physics_2d', 'universes', ['universe_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_physics_2d_scene_id', 'physics_2d', 'scenes', ['scene_id'], ['id'], ondelete='CASCADE')


def downgrade():
    # Drop tables in reverse order of creation
    op.drop_table('physics_2d')
    op.drop_table('music_pieces')
    op.drop_table('music')
    op.drop_table('characters')
    op.drop_table('audio_samples')
    op.drop_table('sound_profiles')
    op.drop_table('scenes')
    op.drop_table('universes')
    op.drop_table('users')
