"""
Physics tests package.
"""

from typing import Dict, Any
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.physics.physics_parameter import PhysicsParameter
from app.models.physics.physics_object import PhysicsObject
from app.models.physics.physics_constraint import PhysicsConstraint
from app.schemas.physics_parameter import PhysicsParameterCreate
from app.schemas.physics_object import PhysicsObjectCreate
from app.schemas.physics_constraint import PhysicsConstraintCreate
from app.crud.physics import physics_parameter, physics_object, physics_constraint

@pytest.fixture
async def test_physics_parameter(
    db: AsyncSession,
    test_scene: Dict[str, Any]
) -> PhysicsParameter:
    """Create a test physics parameter."""
    params_in = PhysicsParameterCreate(
        scene_id=test_scene["id"],
        gravity=9.81,
        air_resistance=0.1,
        collision_elasticity=0.7,
        friction=0.3
    )
    return await physics_parameter.create_with_scene(db, obj_in=params_in)

@pytest.fixture
async def test_physics_object(
    db: AsyncSession,
    test_scene: Dict[str, Any]
) -> PhysicsObject:
    """Create a test physics object."""
    obj_in = PhysicsObjectCreate(
        scene_id=test_scene["id"],
        name="Test Object",
        mass=1.0,
        is_static=False,
        collision_shape="box"
    )
    return await physics_object.create_with_scene(db, obj_in=obj_in)

@pytest.fixture
async def test_physics_constraint(
    db: AsyncSession,
    test_scene: Dict[str, Any],
    test_physics_object: PhysicsObject
) -> PhysicsConstraint:
    """Create a test physics constraint."""
    # Create second object for constraint
    obj2_in = PhysicsObjectCreate(
        scene_id=test_scene["id"],
        name="Test Object 2",
        mass=1.0,
        is_static=False,
        collision_shape="box"
    )
    obj2 = await physics_object.create_with_scene(db, obj_in=obj2_in)

    # Create constraint between objects
    constraint_in = PhysicsConstraintCreate(
        scene_id=test_scene["id"],
        name="Test Constraint",
        constraint_type="hinge",
        object_a_id=test_physics_object.id,
        object_b_id=obj2.id,
        limits={"min_angle": -90, "max_angle": 90}
    )
    return await physics_constraint.create_with_scene(db, obj_in=constraint_in)
