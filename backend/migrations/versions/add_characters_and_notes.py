"""add characters and notes tables

Revision ID: add_characters_and_notes
Revises: 
Create Date: 2024-03-20 19:45:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_characters_and_notes'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create characters table
    op.create_table('characters',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('universe_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['universe_id'], ['universes.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create notes table
    op.create_table('notes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('universe_id', sa.Integer(), nullable=True),
        sa.Column('scene_id', sa.Integer(), nullable=True),
        sa.Column('character_id', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['character_id'], ['characters.id'], ),
        sa.ForeignKeyConstraint(['scene_id'], ['scenes.id'], ),
        sa.ForeignKeyConstraint(['universe_id'], ['universes.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create character_scenes association table
    op.create_table('character_scenes',
        sa.Column('character_id', sa.Integer(), nullable=False),
        sa.Column('scene_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['character_id'], ['characters.id'], ),
        sa.ForeignKeyConstraint(['scene_id'], ['scenes.id'], ),
        sa.PrimaryKeyConstraint('character_id', 'scene_id')
    )

def downgrade():
    op.drop_table('character_scenes')
    op.drop_table('notes')
    op.drop_table('characters') 