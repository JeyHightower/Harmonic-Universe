"""add music and harmony tables

Revision ID: add_music_harmony_tables
Revises: 8d3b6838ca6a
Create Date: 2025-03-25 04:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision = 'add_music_harmony_tables'
down_revision = '8d3b6838ca6a'
branch_labels = None
depends_on = None


def upgrade():
    # Create sound_profiles table first
    op.create_table('sound_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('base_key', sa.String(length=20), nullable=True),
        sa.Column('dominant_scale', sa.String(length=50), nullable=True),
        sa.Column('mood_palette', sa.String(length=255), nullable=True),
        sa.Column('tempo_range', sa.String(length=50), nullable=True),
        sa.Column('instrumentation', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create universes table
    op.create_table('universes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('creator_id', sa.Integer(), nullable=False),
        sa.Column('sound_profile_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['creator_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['sound_profile_id'], ['sound_profiles.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create a new characters table with universe_id
    conn = op.get_bind()
    
    # Get the existing character data
    result = conn.execute(text("SELECT id, name, description, created_at, updated_at FROM characters"))
    characters_data = result.fetchall()
    
    # Create a temporary table to store character data
    op.execute(text("""
        CREATE TABLE characters_temp (
            id INTEGER PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            created_at DATETIME,
            updated_at DATETIME
        )
    """))
    
    # Insert data into temporary table
    for character in characters_data:
        char_id = character[0]
        name = character[1].replace("'", "''") if character[1] else ""
        description = character[2].replace("'", "''") if character[2] else ""
        created_at = character[3] if character[3] else "NULL"
        updated_at = character[4] if character[4] else "NULL"
        
        if created_at != "NULL":
            created_at = f"'{created_at}'"
        if updated_at != "NULL":
            updated_at = f"'{updated_at}'"
        
        op.execute(text(f"""
            INSERT INTO characters_temp (id, name, description, created_at, updated_at)
            VALUES ({char_id}, '{name}', '{description}', {created_at}, {updated_at})
        """))
    
    # Drop the original characters table
    op.drop_table('characters')
    
    # Create the new characters table with the universe_id column
    op.create_table('characters',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('universe_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['universe_id'], ['universes.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Copy data from the temporary table to the new characters table
    op.execute(text("""
        INSERT INTO characters (id, name, description, created_at, updated_at)
        SELECT id, name, description, created_at, updated_at FROM characters_temp
    """))
    
    # Drop the temporary table
    op.execute(text("DROP TABLE characters_temp"))
    
    # Create music_pieces table
    op.create_table('music_pieces',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('creator_id', sa.Integer(), nullable=False),
        sa.Column('file_path', sa.String(length=255), nullable=True),
        sa.Column('duration', sa.Float(), nullable=True),
        sa.Column('tempo', sa.Integer(), nullable=True),
        sa.Column('key', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['creator_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create scenes table
    op.create_table('scenes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('universe_id', sa.Integer(), nullable=False),
        sa.Column('music_piece_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['universe_id'], ['universes.id'], ),
        sa.ForeignKeyConstraint(['music_piece_id'], ['music_pieces.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create harmonies table
    op.create_table('harmonies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('progression', sa.String(length=255), nullable=True),
        sa.Column('key', sa.String(length=20), nullable=True),
        sa.Column('creator_id', sa.Integer(), nullable=False),
        sa.Column('music_piece_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['creator_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['music_piece_id'], ['music_pieces.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create audio_samples table
    op.create_table('audio_samples',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('file_path', sa.String(length=255), nullable=False),
        sa.Column('duration', sa.Float(), nullable=True),
        sa.Column('format', sa.String(length=10), nullable=True),
        sa.Column('sample_rate', sa.Integer(), nullable=True),
        sa.Column('uploader_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['uploader_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create musical_themes table
    op.create_table('musical_themes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('file_path', sa.String(length=255), nullable=True),
        sa.Column('character_id', sa.Integer(), nullable=True),
        sa.Column('universe_id', sa.Integer(), nullable=True),
        sa.Column('key', sa.String(length=20), nullable=True),
        sa.Column('tempo', sa.Integer(), nullable=True),
        sa.Column('mood', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['character_id'], ['characters.id'], ),
        sa.ForeignKeyConstraint(['universe_id'], ['universes.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create association tables
    op.create_table('character_scenes',
        sa.Column('character_id', sa.Integer(), nullable=False),
        sa.Column('scene_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['character_id'], ['characters.id'], ),
        sa.ForeignKeyConstraint(['scene_id'], ['scenes.id'], ),
        sa.PrimaryKeyConstraint('character_id', 'scene_id')
    )
    
    op.create_table('music_audio_samples',
        sa.Column('music_piece_id', sa.Integer(), nullable=False),
        sa.Column('audio_sample_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['music_piece_id'], ['music_pieces.id'], ),
        sa.ForeignKeyConstraint(['audio_sample_id'], ['audio_samples.id'], ),
        sa.PrimaryKeyConstraint('music_piece_id', 'audio_sample_id')
    )
    
    # Add foreign keys to notes table
    with op.batch_alter_table('notes') as batch_op:
        batch_op.create_foreign_key('fk_notes_universe_id', 'universes', ['universe_id'], ['id'])
        batch_op.create_foreign_key('fk_notes_scene_id', 'scenes', ['scene_id'], ['id'])


def downgrade():
    # Save current character data
    conn = op.get_bind()
    result = conn.execute(text("SELECT id, name, description, created_at, updated_at FROM characters"))
    characters_data = result.fetchall()
    
    # Drop all new tables in reverse order
    op.drop_table('music_audio_samples')
    op.drop_table('character_scenes')
    op.drop_table('musical_themes')
    op.drop_table('audio_samples')
    op.drop_table('harmonies')
    op.drop_table('scenes')
    op.drop_table('music_pieces')
    
    # Remove foreign keys from notes
    with op.batch_alter_table('notes') as batch_op:
        batch_op.drop_constraint('fk_notes_universe_id', type_='foreignkey')
        batch_op.drop_constraint('fk_notes_scene_id', type_='foreignkey')
    
    # Create a temporary table for characters
    op.execute(text("""
        CREATE TABLE characters_temp (
            id INTEGER PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            created_at DATETIME,
            updated_at DATETIME
        )
    """))
    
    # Insert character data into temp table
    for character in characters_data:
        char_id = character[0]
        name = character[1].replace("'", "''") if character[1] else ""
        description = character[2].replace("'", "''") if character[2] else ""
        created_at = character[3] if character[3] else "NULL"
        updated_at = character[4] if character[4] else "NULL"
        
        if created_at != "NULL":
            created_at = f"'{created_at}'"
        if updated_at != "NULL":
            updated_at = f"'{updated_at}'"
        
        op.execute(text(f"""
            INSERT INTO characters_temp (id, name, description, created_at, updated_at)
            VALUES ({char_id}, '{name}', '{description}', {created_at}, {updated_at})
        """))
    
    # Drop the new characters table
    op.drop_table('characters')
    
    # Recreate original characters table without universe_id
    op.create_table('characters',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Copy data back
    op.execute(text("""
        INSERT INTO characters (id, name, description, created_at, updated_at)
        SELECT id, name, description, created_at, updated_at FROM characters_temp
    """))
    
    # Drop temp table
    op.execute(text("DROP TABLE characters_temp"))
    
    # Drop remaining tables
    op.drop_table('universes')
    op.drop_table('sound_profiles') 