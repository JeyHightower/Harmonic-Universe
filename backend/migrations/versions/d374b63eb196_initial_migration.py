"""initial migration

Revision ID: d374b63eb196
Revises: 
Create Date: 2025-04-07 08:08:27.881414

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd374b63eb196'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('characters', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_characters_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_characters_is_deleted'), ['is_deleted'], unique=False)
        batch_op.create_index(batch_op.f('ix_characters_updated_at'), ['updated_at'], unique=False)

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('characters', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_characters_updated_at'))
        batch_op.drop_index(batch_op.f('ix_characters_is_deleted'))
        batch_op.drop_index(batch_op.f('ix_characters_created_at'))

    # ### end Alembic commands ###
