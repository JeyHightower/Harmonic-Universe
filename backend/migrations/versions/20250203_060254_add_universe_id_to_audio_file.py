"""add_universe_id_to_audio_file

Revision ID: 867e59ca8eae
Revises: 474995466b07
Create Date: 2025-02-03 06:02:54.771589+00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from app.db.custom_types import GUID


# revision identifiers, used by Alembic.
revision: str = "867e59ca8eae"
down_revision: Union[str, None] = "474995466b07"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add universe_id column as nullable first
    op.add_column(
        "audio_file",
        sa.Column("universe_id", GUID(length=32), nullable=True),
    )

    # Create foreign key constraint
    op.create_foreign_key(
        op.f("fk_audio_file_universe_id_universes"),
        "audio_file",
        "universes",
        ["universe_id"],
        ["id"],
    )

    # Get the first universe id to use as default
    connection = op.get_bind()
    result = connection.execute(text("SELECT id FROM universes LIMIT 1"))
    universe_id = result.scalar()

    if universe_id:
        # Update existing records with the default universe_id
        connection.execute(
            text("UPDATE audio_file SET universe_id = :universe_id WHERE universe_id IS NULL"),
            {"universe_id": universe_id}
        )

    # Make the column not nullable
    op.alter_column("audio_file", "universe_id", nullable=False)


def downgrade() -> None:
    # Drop the foreign key constraint
    op.drop_constraint(
        op.f("fk_audio_file_universe_id_universes"), "audio_file", type_="foreignkey"
    )
    # Drop the column
    op.drop_column("audio_file", "universe_id")
