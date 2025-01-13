"""Initial migration

Revision ID: ba3bed0651ce
Revises:
Create Date: 2025-01-13 12:34:35.548787

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ba3bed0651ce'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create tables
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=120), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint('id', name='pk_users'),
        sa.UniqueConstraint('email', name='uq_users_email'),
        sa.UniqueConstraint('username', name='uq_users_username')
    )

    op.create_table('universes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('creator_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('gravity_constant', sa.Float(), nullable=False),
        sa.Column('environment_harmony', sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(['creator_id'], ['users.id'], name='fk_universes_creator_id_users'),
        sa.PrimaryKeyConstraint('id', name='pk_universes')
    )
    op.create_index('ix_universes_name', 'universes', ['name'])

    # Create other tables
    op.create_table('physics_parameters',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('universe_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('value', sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(['universe_id'], ['universes.id'], name='fk_physics_parameters_universe_id_universes'),
        sa.PrimaryKeyConstraint('id', name='pk_physics_parameters')
    )

    op.create_table('music_parameters',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('universe_id', sa.Integer(), nullable=False),
        sa.Column('tempo', sa.Integer(), nullable=False),
        sa.Column('key', sa.String(length=50), nullable=False),
        sa.Column('scale', sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(['universe_id'], ['universes.id'], name='fk_music_parameters_universe_id_universes'),
        sa.PrimaryKeyConstraint('id', name='pk_music_parameters')
    )

    op.create_table('storyboards',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('universe_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(['universe_id'], ['universes.id'], name='fk_storyboards_universe_id_universes'),
        sa.PrimaryKeyConstraint('id', name='pk_storyboards')
    )


def downgrade():
    op.drop_table('storyboards')
    op.drop_table('music_parameters')
    op.drop_table('physics_parameters')
    op.drop_index('ix_universes_name', 'universes')
    op.drop_table('universes')
    op.drop_table('users')
