"""add_universe_id_to_ai_generations

Revision ID: 474995466b08
Revises: 867e59ca8eae
Create Date: 2025-02-03 06:04:51.611727+00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from app.db.custom_types import GUID


# revision identifiers, used by Alembic.
revision: str = "474995466b08"
down_revision: Union[str, None] = "867e59ca8eae"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add universe_id column as nullable first
    op.add_column(
        "ai_generations",
        sa.Column("universe_id", GUID(length=32), nullable=True),
    )

    # Create foreign key constraint
    op.create_foreign_key(
        op.f("fk_ai_generations_universe_id_universes"),
        "ai_generations",
        "universes",
        ["universe_id"],
        ["id"],
        ondelete="CASCADE"
    )

    # Get the first universe id to use as default
    connection = op.get_bind()
    result = connection.execute(text("SELECT id FROM universes LIMIT 1"))
    universe_id = result.scalar()

    if universe_id:
        # Update existing records with the default universe_id
        connection.execute(
            text("UPDATE ai_generations SET universe_id = :universe_id WHERE universe_id IS NULL"),
            {"universe_id": universe_id}
        )

    # Make the column not nullable
    op.alter_column("ai_generations", "universe_id", nullable=False)


def downgrade() -> None:
    # Drop the foreign key constraint
    op.drop_constraint(
        op.f("fk_ai_generations_universe_id_universes"), "ai_generations", type_="foreignkey"
    )
    # Drop the column
    op.drop_column("ai_generations", "universe_id")
