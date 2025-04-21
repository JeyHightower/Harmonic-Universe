"""update id columns to bigint

Revision ID: update_id_columns
Revises: b7bf77c1b155
Create Date: 2025-04-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c8d9e0f1a2b3'  # Using a proper hex format for revision ID
down_revision = 'b7bf77c1b155'
branch_labels = None
depends_on = None


def upgrade():
    # List of tables to update
    tables = [
        'users',
        'universes',
        'scenes',
        'scene_notes',
        'characters',
        'notes',
        'physics_objects',
        'physics_2d',
        'physics_3d',
        'physics_parameters',
        'sound_profiles',
        'audio_samples',
        'music_pieces',
        'harmonies',
        'musical_themes',
        'music'
    ]

    # Update primary key columns and sequences
    for table in tables:
        # Drop the existing sequence
        op.execute(f'DROP SEQUENCE IF EXISTS {table}_id_seq CASCADE')

        # Create a new bigint sequence
        op.execute(f'CREATE SEQUENCE {table}_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1')

        # Update the column type and default
        with op.batch_alter_table(table) as batch_op:
            # Drop the default first
            batch_op.alter_column('id',
                existing_type=sa.Integer(),
                type_=sa.BigInteger(),
                existing_nullable=False,
                server_default=None)

            # Set the new sequence as default
            batch_op.alter_column('id',
                existing_type=sa.BigInteger(),
                server_default=sa.text(f"nextval('{table}_id_seq'::regclass)"))

    # Update foreign key columns
    fk_columns = [
        ('scene_notes', 'scene_id', 'scenes'),
        ('notes', 'user_id', 'users'),
        ('notes', 'universe_id', 'universes'),
        ('notes', 'scene_id', 'scenes'),
        ('notes', 'character_id', 'characters'),
        ('characters', 'universe_id', 'universes'),
        ('physics_objects', 'universe_id', 'universes'),
        ('physics_objects', 'scene_id', 'scenes'),
        ('physics_2d', 'user_id', 'users'),
        ('physics_2d', 'universe_id', 'universes'),
        ('physics_2d', 'scene_id', 'scenes'),
        ('physics_3d', 'user_id', 'users'),
        ('physics_3d', 'universe_id', 'universes'),
        ('physics_3d', 'scene_id', 'scenes'),
        ('physics_parameters', 'user_id', 'users'),
        ('physics_parameters', 'universe_id', 'universes'),
        ('sound_profiles', 'user_id', 'users'),
        ('sound_profiles', 'universe_id', 'universes'),
        ('sound_profiles', 'scene_id', 'scenes'),
        ('audio_samples', 'user_id', 'users'),
        ('audio_samples', 'sound_profile_id', 'sound_profiles'),
        ('audio_samples', 'universe_id', 'universes'),
        ('audio_samples', 'scene_id', 'scenes'),
        ('music_pieces', 'user_id', 'users'),
        ('music_pieces', 'sound_profile_id', 'sound_profiles'),
        ('music_pieces', 'universe_id', 'universes'),
        ('music_pieces', 'scene_id', 'scenes'),
        ('harmonies', 'music_piece_id', 'music_pieces'),
        ('musical_themes', 'music_piece_id', 'music_pieces'),
        ('musical_themes', 'character_id', 'characters'),
        ('music', 'user_id', 'users'),
        ('music', 'universe_id', 'universes'),
        ('music', 'scene_id', 'scenes'),
        ('universes', 'user_id', 'users'),
        ('universes', 'sound_profile_id', 'sound_profiles'),
        ('scenes', 'universe_id', 'universes'),
        ('scenes', 'sound_profile_id', 'sound_profiles')
    ]

    for table, column, referenced_table in fk_columns:
        with op.batch_alter_table(table) as batch_op:
            batch_op.alter_column(column,
                existing_type=sa.Integer(),
                type_=sa.BigInteger(),
                existing_nullable=True)


def downgrade():
    # List of tables to update
    tables = [
        'users',
        'universes',
        'scenes',
        'scene_notes',
        'characters',
        'notes',
        'physics_objects',
        'physics_2d',
        'physics_3d',
        'physics_parameters',
        'sound_profiles',
        'audio_samples',
        'music_pieces',
        'harmonies',
        'musical_themes',
        'music'
    ]

    # Update primary key columns back to integer
    for table in tables:
        # Drop the bigint sequence
        op.execute(f'DROP SEQUENCE IF EXISTS {table}_id_seq CASCADE')

        # Create a new integer sequence
        op.execute(f'CREATE SEQUENCE {table}_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1')

        # Update the column type and default
        with op.batch_alter_table(table) as batch_op:
            # Drop the default first
            batch_op.alter_column('id',
                existing_type=sa.BigInteger(),
                type_=sa.Integer(),
                existing_nullable=False,
                server_default=None)

            # Set the new sequence as default
            batch_op.alter_column('id',
                existing_type=sa.Integer(),
                server_default=sa.text(f"nextval('{table}_id_seq'::regclass)"))

    # Update foreign key columns back to integer
    fk_columns = [
        ('scene_notes', 'scene_id', 'scenes'),
        ('notes', 'user_id', 'users'),
        ('notes', 'universe_id', 'universes'),
        ('notes', 'scene_id', 'scenes'),
        ('notes', 'character_id', 'characters'),
        ('characters', 'universe_id', 'universes'),
        ('physics_objects', 'universe_id', 'universes'),
        ('physics_objects', 'scene_id', 'scenes'),
        ('physics_2d', 'user_id', 'users'),
        ('physics_2d', 'universe_id', 'universes'),
        ('physics_2d', 'scene_id', 'scenes'),
        ('physics_3d', 'user_id', 'users'),
        ('physics_3d', 'universe_id', 'universes'),
        ('physics_3d', 'scene_id', 'scenes'),
        ('physics_parameters', 'user_id', 'users'),
        ('physics_parameters', 'universe_id', 'universes'),
        ('sound_profiles', 'user_id', 'users'),
        ('sound_profiles', 'universe_id', 'universes'),
        ('sound_profiles', 'scene_id', 'scenes'),
        ('audio_samples', 'user_id', 'users'),
        ('audio_samples', 'sound_profile_id', 'sound_profiles'),
        ('audio_samples', 'universe_id', 'universes'),
        ('audio_samples', 'scene_id', 'scenes'),
        ('music_pieces', 'user_id', 'users'),
        ('music_pieces', 'sound_profile_id', 'sound_profiles'),
        ('music_pieces', 'universe_id', 'universes'),
        ('music_pieces', 'scene_id', 'scenes'),
        ('harmonies', 'music_piece_id', 'music_pieces'),
        ('musical_themes', 'music_piece_id', 'music_pieces'),
        ('musical_themes', 'character_id', 'characters'),
        ('music', 'user_id', 'users'),
        ('music', 'universe_id', 'universes'),
        ('music', 'scene_id', 'scenes'),
        ('universes', 'user_id', 'users'),
        ('universes', 'sound_profile_id', 'sound_profiles'),
        ('scenes', 'universe_id', 'universes'),
        ('scenes', 'sound_profile_id', 'sound_profiles')
    ]

    for table, column, referenced_table in fk_columns:
        with op.batch_alter_table(table) as batch_op:
            batch_op.alter_column(column,
                existing_type=sa.BigInteger(),
                type_=sa.Integer(),
                existing_nullable=True)
