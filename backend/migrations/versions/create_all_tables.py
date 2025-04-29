"""create_all_tables

Revision ID: create_all_tables
Revises:
Create Date: 2025-04-29 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'create_all_tables'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create users table first (no dependencies)
    op.create_table('users',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('username', sa.String(length=80), nullable=False),
        sa.Column('email', sa.String(length=120), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=True),
        sa.Column('version', sa.Integer(), nullable=False),
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

    # Create sound_profiles table (depends on users)
    op.create_table('sound_profiles',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('universe_id', sa.Integer(), nullable=True),
        sa.Column('scene_id', sa.Integer(), nullable=True),
        sa.Column('ambient_volume', sa.Float(), nullable=True),
        sa.Column('music_volume', sa.Float(), nullable=True),
        sa.Column('effects_volume', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('sound_profiles', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_sound_profiles_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_sound_profiles_is_deleted'), ['is_deleted'], unique=False)
        batch_op.create_index(batch_op.f('ix_sound_profiles_name'), ['name'], unique=False)
        batch_op.create_index(batch_op.f('ix_sound_profiles_user_id'), ['user_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_sound_profiles_updated_at'), ['updated_at'], unique=False)

    # Create universes table (depends on users and sound_profiles)
    op.create_table('universes',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('sound_profile_id', sa.Integer(), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False),
        sa.Column('genre', sa.String(length=100), nullable=True),
        sa.Column('theme', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['sound_profile_id'], ['sound_profiles.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('universes', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_universes_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_universes_is_deleted'), ['is_deleted'], unique=False)
        batch_op.create_index(batch_op.f('ix_universes_name'), ['name'], unique=False)
        batch_op.create_index(batch_op.f('ix_universes_sound_profile_id'), ['sound_profile_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_universes_updated_at'), ['updated_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_universes_user_id'), ['user_id'], unique=False)

    # Create scenes table (depends on universes and sound_profiles)
    op.create_table('scenes',
        sa.Column('id', sa.BigInteger(), nullable=False),
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
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['sound_profile_id'], ['sound_profiles.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['universe_id'], ['universes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('scenes', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_scenes_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_scenes_is_deleted'), ['is_deleted'], unique=False)
        batch_op.create_index(batch_op.f('ix_scenes_name'), ['name'], unique=False)
        batch_op.create_index(batch_op.f('ix_scenes_sound_profile_id'), ['sound_profile_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_scenes_universe_id'), ['universe_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_scenes_updated_at'), ['updated_at'], unique=False)

    # Create characters table (depends on universes)
    op.create_table('characters',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('universe_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['universe_id'], ['universes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('characters', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_characters_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_characters_is_deleted'), ['is_deleted'], unique=False)
        batch_op.create_index(batch_op.f('ix_characters_universe_id'), ['universe_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_characters_updated_at'), ['updated_at'], unique=False)

    # Create character_scenes association table (depends on characters and scenes)
    op.create_table('character_scenes',
        sa.Column('character_id', sa.Integer(), nullable=False),
        sa.Column('scene_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['character_id'], ['characters.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['scene_id'], ['scenes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('character_id', 'scene_id')
    )

    # Create notes table (depends on users, universes, scenes, characters)
    op.create_table('notes',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('universe_id', sa.Integer(), nullable=False),
        sa.Column('scene_id', sa.Integer(), nullable=True),
        sa.Column('character_id', sa.Integer(), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False),
        sa.Column('is_archived', sa.Boolean(), nullable=False),
        sa.Column('position_x', sa.Float(), nullable=False),
        sa.Column('position_y', sa.Float(), nullable=False),
        sa.Column('position_z', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['character_id'], ['characters.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['scene_id'], ['scenes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['universe_id'], ['universes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('notes', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_notes_character_id'), ['character_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_notes_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_notes_is_deleted'), ['is_deleted'], unique=False)
        batch_op.create_index(batch_op.f('ix_notes_scene_id'), ['scene_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_notes_title'), ['title'], unique=False)
        batch_op.create_index(batch_op.f('ix_notes_universe_id'), ['universe_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_notes_updated_at'), ['updated_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_notes_user_id'), ['user_id'], unique=False)

    # Create scene_notes table (depends on scenes)
    op.create_table('scene_notes',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('title', sa.String(length=100), nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('scene_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=True),
        sa.Column('importance', sa.String(length=50), nullable=True),
        sa.Column('order', sa.Integer(), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['scene_id'], ['scenes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('scene_notes', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_scene_notes_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_scene_notes_is_deleted'), ['is_deleted'], unique=False)
        batch_op.create_index(batch_op.f('ix_scene_notes_scene_id'), ['scene_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_scene_notes_title'), ['title'], unique=False)
        batch_op.create_index(batch_op.f('ix_scene_notes_updated_at'), ['updated_at'], unique=False)

    # Create audio_samples table (depends on users, sound_profiles, universes, scenes)
    op.create_table('audio_samples',
        sa.Column('id', sa.BigInteger(), nullable=False),
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
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['scene_id'], ['scenes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sound_profile_id'], ['sound_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['universe_id'], ['universes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
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

    # Create music_pieces table (depends on users, sound_profiles, universes, scenes)
    op.create_table('music_pieces',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('sound_profile_id', sa.Integer(), nullable=True),
        sa.Column('universe_id', sa.Integer(), nullable=True),
        sa.Column('scene_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['scene_id'], ['scenes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sound_profile_id'], ['sound_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['universe_id'], ['universes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
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

    # Create musical_themes table (depends on music_pieces and characters)
    op.create_table('musical_themes',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('music_piece_id', sa.Integer(), nullable=False),
        sa.Column('character_id', sa.Integer(), nullable=False),
        sa.Column('motif', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['character_id'], ['characters.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['music_piece_id'], ['music_pieces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('musical_themes', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_musical_themes_character_id'), ['character_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_musical_themes_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_musical_themes_is_deleted'), ['is_deleted'], unique=False)
        batch_op.create_index(batch_op.f('ix_musical_themes_music_piece_id'), ['music_piece_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_musical_themes_name'), ['name'], unique=False)
        batch_op.create_index(batch_op.f('ix_musical_themes_updated_at'), ['updated_at'], unique=False)

    # Create physics_objects table (depends on universes and scenes)
    op.create_table('physics_objects',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('universe_id', sa.Integer(), nullable=False),
        sa.Column('scene_id', sa.Integer(), nullable=True),
        sa.Column('position_x', sa.Float(), nullable=False),
        sa.Column('position_y', sa.Float(), nullable=False),
        sa.Column('position_z', sa.Float(), nullable=False),
        sa.Column('rotation_x', sa.Float(), nullable=False),
        sa.Column('rotation_y', sa.Float(), nullable=False),
        sa.Column('rotation_z', sa.Float(), nullable=False),
        sa.Column('scale_x', sa.Float(), nullable=False),
        sa.Column('scale_y', sa.Float(), nullable=False),
        sa.Column('scale_z', sa.Float(), nullable=False),
        sa.Column('mass', sa.Float(), nullable=False),
        sa.Column('restitution', sa.Float(), nullable=False),
        sa.Column('friction', sa.Float(), nullable=False),
        sa.Column('linear_damping', sa.Float(), nullable=False),
        sa.Column('angular_damping', sa.Float(), nullable=False),
        sa.Column('is_static', sa.Boolean(), nullable=False),
        sa.Column('is_trigger', sa.Boolean(), nullable=False),
        sa.Column('shape_type', sa.String(length=50), nullable=False),
        sa.Column('shape_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['scene_id'], ['scenes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['universe_id'], ['universes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('physics_objects', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_physics_objects_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_objects_is_deleted'), ['is_deleted'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_objects_name'), ['name'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_objects_scene_id'), ['scene_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_objects_universe_id'), ['universe_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_objects_updated_at'), ['updated_at'], unique=False)

    # Create physics_2d table (depends on users and universes)
    op.create_table('physics_2d',
        sa.Column('id', sa.BigInteger(), nullable=False),
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
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['scene_id'], ['scenes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['universe_id'], ['universes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('physics_2d', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_physics_2d_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_2d_is_deleted'), ['is_deleted'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_2d_name'), ['name'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_2d_scene_id'), ['scene_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_2d_universe_id'), ['universe_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_2d_updated_at'), ['updated_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_2d_user_id'), ['user_id'], unique=False)

    # Create physics_3d table (depends on users and universes)
    op.create_table('physics_3d',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('universe_id', sa.Integer(), nullable=False),
        sa.Column('scene_id', sa.Integer(), nullable=True),
        sa.Column('gravity_x', sa.Float(), nullable=False),
        sa.Column('gravity_y', sa.Float(), nullable=False),
        sa.Column('gravity_z', sa.Float(), nullable=False),
        sa.Column('allow_sleep', sa.Boolean(), nullable=False),
        sa.Column('warm_starting', sa.Boolean(), nullable=False),
        sa.Column('continuous_physics', sa.Boolean(), nullable=False),
        sa.Column('sub_stepping', sa.Boolean(), nullable=False),
        sa.Column('velocity_iterations', sa.Integer(), nullable=False),
        sa.Column('position_iterations', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['scene_id'], ['scenes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['universe_id'], ['universes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('physics_3d', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_physics_3d_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_3d_is_deleted'), ['is_deleted'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_3d_name'), ['name'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_3d_scene_id'), ['scene_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_3d_universe_id'), ['universe_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_3d_updated_at'), ['updated_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_3d_user_id'), ['user_id'], unique=False)

    # Create physics_parameters table (depends on users and universes)
    op.create_table('physics_parameters',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('universe_id', sa.Integer(), nullable=False),
        sa.Column('gravity_x', sa.Float(), nullable=False),
        sa.Column('gravity_y', sa.Float(), nullable=False),
        sa.Column('gravity_z', sa.Float(), nullable=False),
        sa.Column('fixed_timestep', sa.Float(), nullable=False),
        sa.Column('max_substeps', sa.Integer(), nullable=False),
        sa.Column('solver_iterations', sa.Integer(), nullable=False),
        sa.Column('collision_iterations', sa.Integer(), nullable=False),
        sa.Column('default_restitution', sa.Float(), nullable=False),
        sa.Column('default_friction', sa.Float(), nullable=False),
        sa.Column('default_linear_damping', sa.Float(), nullable=False),
        sa.Column('default_angular_damping', sa.Float(), nullable=False),
        sa.Column('continuous_collision_detection', sa.Boolean(), nullable=False),
        sa.Column('allow_sleep', sa.Boolean(), nullable=False),
        sa.Column('collision_margin', sa.Float(), nullable=False),
        sa.Column('air_density', sa.Float(), nullable=False),
        sa.Column('water_density', sa.Float(), nullable=False),
        sa.Column('use_aerodynamics', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['universe_id'], ['universes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('physics_parameters', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_physics_parameters_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_parameters_is_deleted'), ['is_deleted'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_parameters_name'), ['name'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_parameters_universe_id'), ['universe_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_parameters_updated_at'), ['updated_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_parameters_user_id'), ['user_id'], unique=False)

    # Create physics_constraints table (depends on physics_objects)
    op.create_table('physics_constraints',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('body_a_id', sa.Integer(), nullable=False),
        sa.Column('body_b_id', sa.Integer(), nullable=False),
        sa.Column('scene_id', sa.Integer(), nullable=True),
        sa.Column('universe_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['body_a_id'], ['physics_objects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['body_b_id'], ['physics_objects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['scene_id'], ['scenes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['universe_id'], ['universes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('physics_constraints', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_physics_constraints_body_a_id'), ['body_a_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_constraints_body_b_id'), ['body_b_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_constraints_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_constraints_is_deleted'), ['is_deleted'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_constraints_name'), ['name'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_constraints_scene_id'), ['scene_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_constraints_universe_id'), ['universe_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_physics_constraints_updated_at'), ['updated_at'], unique=False)


def downgrade():
    # Drop tables in reverse order
    op.drop_table('physics_constraints')
    op.drop_table('physics_parameters')
    op.drop_table('physics_3d')
    op.drop_table('physics_2d')
    op.drop_table('physics_objects')
    op.drop_table('musical_themes')
    op.drop_table('music_pieces')
    op.drop_table('audio_samples')
    op.drop_table('scene_notes')
    op.drop_table('notes')
    op.drop_table('character_scenes')
    op.drop_table('characters')
    op.drop_table('scenes')
    op.drop_table('universes')
    op.drop_table('sound_profiles')
    op.drop_table('users')
