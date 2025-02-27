"""Initial migration

Revision ID: 13a071731971
Revises: 
Create Date: 2025-01-31 07:10:36.164445+00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "13a071731971"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "user",
        sa.Column("username", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password", sa.String(), nullable=False),
        sa.Column("display_name", sa.String(), nullable=True),
        sa.Column("avatar_url", sa.String(), nullable=True),
        sa.Column("bio", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "settings", postgresql.JSONB(astext_type=sa.Text()), nullable=False
        ),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_user")),
    )
    op.create_index(op.f("ix_user_email"), "user", ["email"], unique=True)
    op.create_index(
        op.f("ix_user_username"), "user", ["username"], unique=True
    )
    op.create_table(
        "universe",
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("owner_id", sa.UUID(), nullable=False),
        sa.Column("is_public", sa.Boolean(), nullable=False),
        sa.Column(
            "collaborators", postgresql.ARRAY(sa.String()), nullable=False
        ),
        sa.Column(
            "settings", postgresql.JSONB(astext_type=sa.Text()), nullable=False
        ),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["owner_id"], ["user.id"], name=op.f("fk_universe_owner_id_user")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_universe")),
    )
    op.create_table(
        "scene",
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column(
            "content", postgresql.JSONB(astext_type=sa.Text()), nullable=False
        ),
        sa.Column("universe_id", sa.UUID(), nullable=False),
        sa.Column("creator_id", sa.UUID(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column(
            "settings", postgresql.JSONB(astext_type=sa.Text()), nullable=False
        ),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["creator_id"], ["user.id"], name=op.f("fk_scene_creator_id_user")
        ),
        sa.ForeignKeyConstraint(
            ["universe_id"],
            ["universe.id"],
            name=op.f("fk_scene_universe_id_universe"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_scene")),
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table("scene")
    op.drop_table("universe")
    op.drop_index(op.f("ix_user_username"), table_name="user")
    op.drop_index(op.f("ix_user_email"), table_name="user")
    op.drop_table("user")
    # ### end Alembic commands ###
