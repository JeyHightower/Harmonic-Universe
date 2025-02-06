"""
Tests for physics objects.
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.physics.physics_object import PhysicsObject
from app.schemas.physics_object import (
    PhysicsObjectCreate,
    PhysicsObjectUpdate,
    Vector3D
)
from app.crud.physics import physics_object

@pytest.mark.asyncio
async def test_create_physics_object(
    db: AsyncSession,
    test_scene: Dict[str, Any]
):
    """Test creating a physics object."""
    obj_in = PhysicsObjectCreate(
        scene_id=test_scene["id"],
        name="Test Object",
        mass=1.0,
        position=Vector3D(x=0.0, y=1.0, z=0.0),
        velocity=Vector3D(x=0.0, y=0.0, z=0.0),
        rotation=Vector3D(x=0.0, y=0.0, z=0.0),
        scale=Vector3D(x=1.0, y=1.0, z=1.0),
        is_static=False,
        collision_shape="box"
    )

    obj = await physics_object.create_with_scene(db, obj_in=obj_in)
    assert obj.scene_id == test_scene["id"]
    assert obj.name == "Test Object"
    assert obj.mass == 1.0
    assert obj.position["y"] == 1.0
    assert not obj.is_static
    assert obj.collision_shape == "box"

@pytest.mark.asyncio
async def test_get_physics_objects(
    db: AsyncSession,
    test_scene: Dict[str, Any]
):
    """Test getting physics objects."""
    # Create test objects
    obj_in = PhysicsObjectCreate(
        scene_id=test_scene["id"],
        name="Test Object 1",
        mass=1.0,
        position=Vector3D(x=0.0, y=1.0, z=0.0),
        is_static=False
    )
    obj1 = await physics_object.create_with_scene(db, obj_in=obj_in)

    obj_in.name = "Test Object 2"
    obj_in.position = Vector3D(x=1.0, y=1.0, z=0.0)
    obj2 = await physics_object.create_with_scene(db, obj_in=obj_in)

    # Get objects
    objects = await physics_object.get_by_scene(db, scene_id=test_scene["id"])
    assert len(objects) == 2
    assert any(obj.name == "Test Object 1" for obj in objects)
    assert any(obj.name == "Test Object 2" for obj in objects)

@pytest.mark.asyncio
async def test_update_physics_object(
    db: AsyncSession,
    test_scene: Dict[str, Any]
):
    """Test updating a physics object."""
    # Create test object
    obj_in = PhysicsObjectCreate(
        scene_id=test_scene["id"],
        name="Test Object",
        mass=1.0,
        position=Vector3D(x=0.0, y=1.0, z=0.0),
        is_static=False
    )
    obj = await physics_object.create_with_scene(db, obj_in=obj_in)

    # Update object
    new_position = Vector3D(x=2.0, y=3.0, z=1.0)
    updated_obj = await physics_object.update_with_position(
        db,
        db_obj=obj,
        position=new_position.dict()
    )

    assert updated_obj.position["x"] == 2.0
    assert updated_obj.position["y"] == 3.0
    assert updated_obj.position["z"] == 1.0

@pytest.mark.asyncio
async def test_update_physics_state(
    db: AsyncSession,
    test_scene: Dict[str, Any]
):
    """Test updating complete physics state."""
    # Create test object
    obj_in = PhysicsObjectCreate(
        scene_id=test_scene["id"],
        name="Test Object",
        mass=1.0,
        position=Vector3D(x=0.0, y=1.0, z=0.0),
        velocity=Vector3D(x=0.0, y=0.0, z=0.0),
        is_static=False
    )
    obj = await physics_object.create_with_scene(db, obj_in=obj_in)

    # Update state
    new_state = {
        "position": {"x": 2.0, "y": 3.0, "z": 1.0},
        "velocity": {"x": 1.0, "y": 0.0, "z": 0.0},
        "rotation": {"x": 45.0, "y": 0.0, "z": 0.0}
    }
    updated_obj = await physics_object.update_physics_state(
        db,
        db_obj=obj,
        state=new_state
    )

    assert updated_obj.position == new_state["position"]
    assert updated_obj.velocity == new_state["velocity"]
    assert updated_obj.rotation == new_state["rotation"]

@pytest.mark.asyncio
async def test_get_static_objects(
    db: AsyncSession,
    test_scene: Dict[str, Any]
):
    """Test getting static objects."""
    # Create test objects
    obj_in = PhysicsObjectCreate(
        scene_id=test_scene["id"],
        name="Static Object",
        mass=1.0,
        is_static=True
    )
    static_obj = await physics_object.create_with_scene(db, obj_in=obj_in)

    obj_in.name = "Dynamic Object"
    obj_in.is_static = False
    dynamic_obj = await physics_object.create_with_scene(db, obj_in=obj_in)

    # Get static objects
    static_objects = await physics_object.get_static_objects(db, scene_id=test_scene["id"])
    assert len(static_objects) == 1
    assert static_objects[0].name == "Static Object"
    assert static_objects[0].is_static

@pytest.mark.asyncio
async def test_get_dynamic_objects(
    db: AsyncSession,
    test_scene: Dict[str, Any]
):
    """Test getting dynamic objects."""
    # Create test objects
    obj_in = PhysicsObjectCreate(
        scene_id=test_scene["id"],
        name="Static Object",
        mass=1.0,
        is_static=True
    )
    static_obj = await physics_object.create_with_scene(db, obj_in=obj_in)

    obj_in.name = "Dynamic Object"
    obj_in.is_static = False
    dynamic_obj = await physics_object.create_with_scene(db, obj_in=obj_in)

    # Get dynamic objects
    dynamic_objects = await physics_object.get_dynamic_objects(db, scene_id=test_scene["id"])
    assert len(dynamic_objects) == 1
    assert dynamic_objects[0].name == "Dynamic Object"
    assert not dynamic_objects[0].is_static

@pytest.mark.asyncio
async def test_get_by_name(
    db: AsyncSession,
    test_scene: Dict[str, Any]
):
    """Test getting object by name."""
    # Create test object
    obj_in = PhysicsObjectCreate(
        scene_id=test_scene["id"],
        name="Named Object",
        mass=1.0
    )
    created_obj = await physics_object.create_with_scene(db, obj_in=obj_in)

    # Get object by name
    found_obj = await physics_object.get_by_name(
        db,
        scene_id=test_scene["id"],
        name="Named Object"
    )
    assert found_obj is not None
    assert found_obj.id == created_obj.id
    assert found_obj.name == "Named Object"

@pytest.mark.asyncio
async def test_delete_physics_object(
    db: AsyncSession,
    test_scene: Dict[str, Any]
):
    """Test deleting a physics object."""
    # Create test object
    obj_in = PhysicsObjectCreate(
        scene_id=test_scene["id"],
        name="Test Object",
        mass=1.0
    )
    obj = await physics_object.create_with_scene(db, obj_in=obj_in)

    # Delete object
    deleted_obj = await physics_object.remove(db, id=obj.id)
    assert deleted_obj is not None
    assert deleted_obj.id == obj.id

    # Verify deletion
    found_obj = await physics_object.get(db, id=obj.id)
    assert found_obj is None
