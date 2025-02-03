"""convert_enums_to_strings

Revision ID: 474995466b07
Revises: 7f4d7e1ac84c
Create Date: 2025-02-03 05:57:05.611727+00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "474995466b07"
down_revision: Union[str, None] = "7f4d7e1ac84c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add rendering_mode column to scenes if it doesn't exist
    op.add_column('scenes', sa.Column('rendering_mode', sa.String(), nullable=True))

    # Set default values for rendering_mode
    op.execute("UPDATE scenes SET rendering_mode = 'SOLID' WHERE rendering_mode IS NULL")

    # Make rendering_mode not nullable
    op.alter_column('scenes', 'rendering_mode', nullable=False)

    # Convert AudioFormat enum in audio_file table
    op.alter_column('audio_file', 'format',
                    type_=sa.String(),
                    existing_type=postgresql.ENUM('WAV', 'MP3', 'OGG', 'MIDI', name='audioformat'),
                    postgresql_using='format::text',
                    existing_nullable=False)

    # Convert AudioType enum in audio_file table
    op.alter_column('audio_file', 'type',
                    type_=sa.String(),
                    existing_type=postgresql.ENUM('MUSIC', 'SOUND_EFFECT', 'VOICE', 'AMBIENT', name='audiotype'),
                    postgresql_using='type::text',
                    existing_nullable=False)

    # Drop the enum types
    op.execute('DROP TYPE IF EXISTS audioformat')
    op.execute('DROP TYPE IF EXISTS audiotype')


def downgrade() -> None:
    # Recreate enum types
    op.execute("CREATE TYPE audioformat AS ENUM ('WAV', 'MP3', 'OGG', 'MIDI')")
    op.execute("CREATE TYPE audiotype AS ENUM ('MUSIC', 'SOUND_EFFECT', 'VOICE', 'AMBIENT')")

    # Convert back to enum types
    op.alter_column('audio_file', 'format',
                    type_=postgresql.ENUM('WAV', 'MP3', 'OGG', 'MIDI', name='audioformat'),
                    existing_type=sa.String(),
                    postgresql_using='format::audioformat')

    op.alter_column('audio_file', 'type',
                    type_=postgresql.ENUM('MUSIC', 'SOUND_EFFECT', 'VOICE', 'AMBIENT', name='audiotype'),
                    existing_type=sa.String(),
                    postgresql_using='type::audiotype')

    # Drop rendering_mode column from scenes
    op.drop_column('scenes', 'rendering_mode')
