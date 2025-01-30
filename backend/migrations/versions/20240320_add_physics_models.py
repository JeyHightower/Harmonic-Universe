"""Add physics models and relationships.

Revision ID: 20240320_add_physics_models
Revises: previous_migration_id
Create Date: 2024-03-20 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic
revision = '20240320_add_physics_models'
down_revision = 'previous_migration_id'  # Update this to your last migration
branch_labels = None
depends_on = None

def upgrade():
    # Add physics_settings to scenes table
    op.add_column('scenes', sa.Column('physics_settings', sa.JSON(), nullable=False, server_default='{"gravity": {"x": 0, "y": -9.81}, "time_step": 0.016666667, "velocity_iterations": 8, "position_iterations": 3, "enabled": false}'))

    # Create physics_objects table
    op.create_table(
        'physics_objects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('scene_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('object_type', sa.String(length=50), nullable=False),
        sa.Column('mass', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('position', sa.JSON(), nullable=False),
        sa.Column('velocity', sa.JSON(), nullable=False, server_default='{"x": 0, "y": 0}'),
        sa.Column('acceleration', sa.JSON(), nullable=False, server_default='{"x": 0, "y": 0}'),
        sa.Column('angle', sa.Float(), nullable=False, server_default='0'),
        sa.Column('angular_velocity', sa.Float(), nullable=False, server_default='0'),
        sa.Column('dimensions', sa.JSON(), nullable=False),
        sa.Column('restitution', sa.Float(), nullable=False, server_default='0.6'),
        sa.Column('friction', sa.Float(), nullable=False, server_default='0.1'),
        sa.Column('is_static', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_sensor', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('collision_filter', sa.JSON(), nullable=False, server_default='{"category": 1, "mask": 4294967295}'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['scene_id'], ['scenes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create physics_constraints table
    op.create_table(
        'physics_constraints',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('scene_id', sa.Integer(), nullable=False),
        sa.Column('object_a_id', sa.Integer(), nullable=False),
        sa.Column('object_b_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('constraint_type', sa.String(length=50), nullable=False),
        sa.Column('anchor_a', sa.JSON(), nullable=False),
        sa.Column('anchor_b', sa.JSON(), nullable=False),
        sa.Column('stiffness', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('damping', sa.Float(), nullable=False, server_default='0.7'),
        sa.Column('properties', sa.JSON(), nullable=False, server_default='{"min_length": null, "max_length": null, "angle_limits": null, "axis": {"x": 1, "y": 0}, "translation_limits": null}'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['object_a_id'], ['physics_objects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['object_b_id'], ['physics_objects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['scene_id'], ['scenes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('ix_physics_objects_scene_id', 'physics_objects', ['scene_id'])
    op.create_index('ix_physics_constraints_scene_id', 'physics_constraints', ['scene_id'])
    op.create_index('ix_physics_constraints_object_a_id', 'physics_constraints', ['object_a_id'])
    op.create_index('ix_physics_constraints_object_b_id', 'physics_constraints', ['object_b_id'])

def downgrade():
    # Drop indexes
    op.drop_index('ix_physics_constraints_object_b_id')
    op.drop_index('ix_physics_constraints_object_a_id')
    op.drop_index('ix_physics_constraints_scene_id')
    op.drop_index('ix_physics_objects_scene_id')

    # Drop tables
    op.drop_table('physics_constraints')
    op.drop_table('physics_objects')

    # Remove physics_settings from scenes
    op.drop_column('scenes', 'physics_settings')
