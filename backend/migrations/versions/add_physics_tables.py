"""add physics tables

Revision ID: add_physics_tables
Revises: add_music_harmony_tables
Create Date: 2025-03-25 05:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_physics_tables'
down_revision = 'add_music_harmony_tables'
branch_labels = None
depends_on = None


def upgrade():
    # Add is_2d column to universes table
    with op.batch_alter_table('universes') as batch_op:
        batch_op.add_column(sa.Column('is_2d', sa.Boolean(), nullable=True, server_default='1'))
    
    # Add is_2d column to scenes table
    with op.batch_alter_table('scenes') as batch_op:
        batch_op.add_column(sa.Column('is_2d', sa.Boolean(), nullable=True, server_default='1'))
    
    # Add has_physics column to characters table
    with op.batch_alter_table('characters') as batch_op:
        batch_op.add_column(sa.Column('has_physics', sa.Boolean(), nullable=True, server_default='0'))
        
    # Create physics_2d table
    op.create_table('physics_2d',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('gravity_x', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('gravity_y', sa.Float(), nullable=True, server_default='9.8'),
        sa.Column('friction', sa.Float(), nullable=True, server_default='0.1'),
        sa.Column('restitution', sa.Float(), nullable=True, server_default='0.5'),
        sa.Column('linear_damping', sa.Float(), nullable=True, server_default='0.1'),
        sa.Column('angular_damping', sa.Float(), nullable=True, server_default='0.1'),
        sa.Column('time_scale', sa.Float(), nullable=True, server_default='1.0'),
        sa.Column('universe_id', sa.Integer(), nullable=True),
        sa.Column('scene_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['scene_id'], ['scenes.id'], ),
        sa.ForeignKeyConstraint(['universe_id'], ['universes.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create physics_3d table
    op.create_table('physics_3d',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('gravity_x', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('gravity_y', sa.Float(), nullable=True, server_default='-9.8'),
        sa.Column('gravity_z', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('friction', sa.Float(), nullable=True, server_default='0.3'),
        sa.Column('restitution', sa.Float(), nullable=True, server_default='0.5'),
        sa.Column('linear_damping', sa.Float(), nullable=True, server_default='0.05'),
        sa.Column('angular_damping', sa.Float(), nullable=True, server_default='0.05'),
        sa.Column('collision_margin', sa.Float(), nullable=True, server_default='0.04'),
        sa.Column('continuous_detection', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('substeps', sa.Integer(), nullable=True, server_default='2'),
        sa.Column('solver_iterations', sa.Integer(), nullable=True, server_default='10'),
        sa.Column('time_scale', sa.Float(), nullable=True, server_default='1.0'),
        sa.Column('universe_id', sa.Integer(), nullable=True),
        sa.Column('scene_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['scene_id'], ['scenes.id'], ),
        sa.ForeignKeyConstraint(['universe_id'], ['universes.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create physics_objects table
    op.create_table('physics_objects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('object_type', sa.String(length=50), nullable=False),
        sa.Column('is_static', sa.Boolean(), nullable=True, server_default='0'),
        sa.Column('is_2d', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('position_x', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('position_y', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('position_z', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('rotation_x', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('rotation_y', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('rotation_z', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('scale_x', sa.Float(), nullable=True, server_default='1.0'),
        sa.Column('scale_y', sa.Float(), nullable=True, server_default='1.0'),
        sa.Column('scale_z', sa.Float(), nullable=True, server_default='1.0'),
        sa.Column('mass', sa.Float(), nullable=True, server_default='1.0'),
        sa.Column('friction', sa.Float(), nullable=True, server_default='0.3'),
        sa.Column('restitution', sa.Float(), nullable=True, server_default='0.5'),
        sa.Column('linear_damping', sa.Float(), nullable=True, server_default='0.05'),
        sa.Column('angular_damping', sa.Float(), nullable=True, server_default='0.05'),
        sa.Column('collision_group', sa.Integer(), nullable=True, server_default='1'),
        sa.Column('collision_mask', sa.Integer(), nullable=True, server_default='1'),
        sa.Column('universe_id', sa.Integer(), nullable=True),
        sa.Column('scene_id', sa.Integer(), nullable=True),
        sa.Column('character_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['character_id'], ['characters.id'], ),
        sa.ForeignKeyConstraint(['scene_id'], ['scenes.id'], ),
        sa.ForeignKeyConstraint(['universe_id'], ['universes.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create physics_parameters table
    op.create_table('physics_parameters',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('parameter_type', sa.String(length=50), nullable=False),
        sa.Column('float_value', sa.Float(), nullable=True),
        sa.Column('int_value', sa.Integer(), nullable=True),
        sa.Column('bool_value', sa.Boolean(), nullable=True),
        sa.Column('string_value', sa.String(length=255), nullable=True),
        sa.Column('min_value', sa.Float(), nullable=True),
        sa.Column('max_value', sa.Float(), nullable=True),
        sa.Column('vector_x', sa.Float(), nullable=True),
        sa.Column('vector_y', sa.Float(), nullable=True),
        sa.Column('vector_z', sa.Float(), nullable=True),
        sa.Column('is_2d', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('physics_2d_id', sa.Integer(), nullable=True),
        sa.Column('physics_3d_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['physics_2d_id'], ['physics_2d.id'], ),
        sa.ForeignKeyConstraint(['physics_3d_id'], ['physics_3d.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create physics_constraints table
    op.create_table('physics_constraints',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('constraint_type', sa.String(length=50), nullable=False),
        sa.Column('object_a_id', sa.Integer(), nullable=False),
        sa.Column('object_b_id', sa.Integer(), nullable=True),
        sa.Column('breaking_threshold', sa.Float(), nullable=True),
        sa.Column('position_x', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('position_y', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('position_z', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('axis_x', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('axis_y', sa.Float(), nullable=True, server_default='1.0'),
        sa.Column('axis_z', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('limit_lower', sa.Float(), nullable=True),
        sa.Column('limit_upper', sa.Float(), nullable=True),
        sa.Column('spring_stiffness', sa.Float(), nullable=True),
        sa.Column('spring_damping', sa.Float(), nullable=True),
        sa.Column('is_2d', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('is_enabled', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('scene_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['object_a_id'], ['physics_objects.id'], ),
        sa.ForeignKeyConstraint(['object_b_id'], ['physics_objects.id'], ),
        sa.ForeignKeyConstraint(['scene_id'], ['scenes.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    # Drop tables in reverse order of creation
    op.drop_table('physics_constraints')
    op.drop_table('physics_parameters')
    op.drop_table('physics_objects')
    op.drop_table('physics_3d')
    op.drop_table('physics_2d')
    
    # Remove columns from existing tables
    with op.batch_alter_table('characters') as batch_op:
        batch_op.drop_column('has_physics')
    
    with op.batch_alter_table('scenes') as batch_op:
        batch_op.drop_column('is_2d')
    
    with op.batch_alter_table('universes') as batch_op:
        batch_op.drop_column('is_2d') 