"""
Tests for physics constraints.
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.physics.physics_constraint import PhysicsConstraint
from app.schemas.physics_constraint import (
    PhysicsConstraintCreate,
    PhysicsConstraintUpdate,
    Vector3D
)
from app.crud.physics import physics_constraint, physics_object

@pytest.mark.asyncio
async def test_create_physics_constraint(
    db: AsyncSession,
    test_scene: Dict[str, Any]
):
    """Test creating a physics constraint."""
    # Create test objects
    obj1 = await physics_object.create_with_scene(
        db,
        obj_in=PhysicsObjectCreate(
            scene_id=test_scene["id"],
            name="Object A",
            mass=1.0
        )
    )
    obj2 = await physics_object.create_with_scene(
        db,
        obj_in=PhysicsObjectCreate(
            scene_id=test_scene["id"],
            name="Object B",
            mass=1.0
        )
    )

    # Create constraint
    constraint_in = PhysicsConstraintCreate(
        scene_id=test_scene["id"],
        name="Test Constraint",
        constraint_type="hinge",
        object_a_id=obj1.id,
        object_b_id=obj2.id,
        anchor_a=Vector3D(x=0.0, y=1.0, z=0.0),
        anchor_b=Vector3D(x=0.0, y=-1.0, z=0.0),
        axis_a=Vector3D(x=0.0, y=1.0, z=0.0),
        axis_b=Vector3D(x=0.0, y=1.0, z=0.0),
        limits={"min_angle": -90, "max_angle": 90}
    )

    constraint = await physics_constraint.create_with_scene(db, obj_in=constraint_in)
    assert constraint.scene_id == test_scene["id"]
    assert constraint.name == "Test Constraint"
    assert constraint.constraint_type == "hinge"
    assert constraint.object_a_id == obj1.id
    assert constraint.object_b_id == obj2.id
    assert constraint.limits["min_angle"] == -90

@pytest.mark.asyncio
async def test_get_physics_constraints(
    db: AsyncSession,
    test_scene: Dict[str, Any]
):
    """Test getting physics constraints."""
    # Create test objects and constraints
    obj1 = await physics_object.create_with_scene(
        db,
        obj_in=PhysicsObjectCreate(
            scene_id=test_scene["id"],
            name="Object A",
            mass=1.0
        )
    )
    obj2 = await physics_object.create_with_scene(
        db,
        obj_in=PhysicsObjectCreate(
            scene_id=test_scene["id"],
            name="Object B",
            mass=1.0
        )
    )

    constraint_in = PhysicsConstraintCreate(
        scene_id=test_scene["id"],
        name="Constraint 1",
        constraint_type="hinge",
        object_a_id=obj1.id,
        object_b_id=obj2.id
    )
    constraint1 = await physics_constraint.create_with_scene(db, obj_in=constraint_in)

    constraint_in.name = "Constraint 2"
    constraint2 = await physics_constraint.create_with_scene(db, obj_in=constraint_in)

    # Get constraints
    constraints = await physics_constraint.get_by_scene(db, scene_id=test_scene["id"])
    assert len(constraints) == 2
    assert any(c.name == "Constraint 1" for c in constraints)
    assert any(c.name == "Constraint 2" for c in constraints)

@pytest.mark.asyncio
async def test_get_constraints_by_object(
    db: AsyncSession,
    test_scene: Dict[str, Any]
):
    """Test getting constraints by object."""
    # Create test objects
    obj1 = await physics_object.create_with_scene(
        db,
        obj_in=PhysicsObjectCreate(
            scene_id=test_scene["id"],
            name="Object A",
            mass=1.0
        )
    )
    obj2 = await physics_object.create_with_scene(
        db,
        obj_in=PhysicsObjectCreate(
            scene_id=test_scene["id"],
            name="Object B",
            mass=1.0
        )
    )
    obj3 = await physics_object.create_with_scene(
        db,
        obj_in=PhysicsObjectCreate(
            scene_id=test_scene["id"],
            name="Object C",
            mass=1.0
        )
    )

    # Create constraints
    constraint_in = PhysicsConstraintCreate(
        scene_id=test_scene["id"],
        name="Constraint 1",
        constraint_type="hinge",
        object_a_id=obj1.id,
        object_b_id=obj2.id
    )
    await physics_constraint.create_with_scene(db, obj_in=constraint_in)

    constraint_in.name = "Constraint 2"
    constraint_in.object_b_id = obj3.id
    await physics_constraint.create_with_scene(db, obj_in=constraint_in)

    # Get constraints for object 1
    constraints = await physics_constraint.get_by_object(db, object_id=obj1.id)
    assert len(constraints) == 2
    assert all(c.object_a_id == obj1.id for c in constraints)

@pytest.mark.asyncio
async def test_update_constraint_limits(
    db: AsyncSession,
    test_scene: Dict[str, Any]
):
    """Test updating constraint limits."""
    # Create test objects and constraint
    obj1 = await physics_object.create_with_scene(
        db,
        obj_in=PhysicsObjectCreate(
            scene_id=test_scene["id"],
            name="Object A",
            mass=1.0
        )
    )
    obj2 = await physics_object.create_with_scene(
        db,
        obj_in=PhysicsObjectCreate(
            scene_id=test_scene["id"],
            name="Object B",
            mass=1.0
        )
    )

    constraint_in = PhysicsConstraintCreate(
        scene_id=test_scene["id"],
        name="Test Constraint",
        constraint_type="hinge",
        object_a_id=obj1.id,
        object_b_id=obj2.id,
        limits={"min_angle": -90, "max_angle": 90}
    )
    constraint = await physics_constraint.create_with_scene(db, obj_in=constraint_in)

    # Update limits
    new_limits = {"min_angle": -45, "max_angle": 45}
    updated_constraint = await physics_constraint.update_limits(
        db,
        db_obj=constraint,
        limits=new_limits
    )

    assert updated_constraint.limits == new_limits

@pytest.mark.asyncio
async def test_toggle_constraint(
    db: AsyncSession,
    test_scene: Dict[str, Any]
):
    """Test toggling constraint enabled state."""
    # Create test objects and constraint
    obj1 = await physics_object.create_with_scene(
        db,
        obj_in=PhysicsObjectCreate(
            scene_id=test_scene["id"],
            name="Object A",
            mass=1.0
        )
    )
    obj2 = await physics_object.create_with_scene(
        db,
        obj_in=PhysicsObjectCreate(
            scene_id=test_scene["id"],
            name="Object B",
            mass=1.0
        )
    )

    constraint_in = PhysicsConstraintCreate(
        scene_id=test_scene["id"],
        name="Test Constraint",
        constraint_type="hinge",
        object_a_id=obj1.id,
        object_b_id=obj2.id,
        enabled=True
    )
    constraint = await physics_constraint.create_with_scene(db, obj_in=constraint_in)

    # Toggle constraint
    updated_constraint = await physics_constraint.toggle_enabled(db, db_obj=constraint)
    assert not updated_constraint.enabled

    # Toggle again
    updated_constraint = await physics_constraint.toggle_enabled(db, db_obj=constraint)
    assert updated_constraint.enabled

@pytest.mark.asyncio
async def test_delete_physics_constraint(
    db: AsyncSession,
    test_scene: Dict[str, Any]
):
    """Test deleting a physics constraint."""
    # Create test objects and constraint
    obj1 = await physics_object.create_with_scene(
        db,
        obj_in=PhysicsObjectCreate(
            scene_id=test_scene["id"],
            name="Object A",
            mass=1.0
        )
    )
    obj2 = await physics_object.create_with_scene(
        db,
        obj_in=PhysicsObjectCreate(
            scene_id=test_scene["id"],
            name="Object B",
            mass=1.0
        )
    )

    constraint_in = PhysicsConstraintCreate(
        scene_id=test_scene["id"],
        name="Test Constraint",
        constraint_type="hinge",
        object_a_id=obj1.id,
        object_b_id=obj2.id
    )
    constraint = await physics_constraint.create_with_scene(db, obj_in=constraint_in)

    # Delete constraint
    deleted_constraint = await physics_constraint.remove(db, id=constraint.id)
    assert deleted_constraint is not None
    assert deleted_constraint.id == constraint.id

    # Verify deletion
    found_constraint = await physics_constraint.get(db, id=constraint.id)
    assert found_constraint is None
