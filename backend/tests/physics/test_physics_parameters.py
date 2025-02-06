"""
Tests for physics parameters.
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.physics.physics_parameter import PhysicsParameter
from app.schemas.physics_parameter import PhysicsParameterCreate, PhysicsParameterUpdate
from app.crud.physics import physics_parameter

@pytest.mark.asyncio
async def test_create_physics_parameters(
    db: AsyncSession,
    test_scene: Dict[str, Any]
):
    """Test creating physics parameters."""
    params_in = PhysicsParameterCreate(
        scene_id=test_scene["id"],
        gravity=9.81,
        air_resistance=0.1,
        collision_elasticity=0.7,
        friction=0.3
    )

    params = await physics_parameter.create_with_scene(db, obj_in=params_in)
    assert params.scene_id == test_scene["id"]
    assert params.gravity == 9.81
    assert params.air_resistance == 0.1
    assert params.collision_elasticity == 0.7
    assert params.friction == 0.3

@pytest.mark.asyncio
async def test_get_physics_parameters(
    db: AsyncSession,
    test_scene: Dict[str, Any]
):
    """Test getting physics parameters."""
    # Create test parameters
    params_in = PhysicsParameterCreate(
        scene_id=test_scene["id"],
        gravity=9.81,
        air_resistance=0.1,
        collision_elasticity=0.7,
        friction=0.3
    )
    created_params = await physics_parameter.create_with_scene(db, obj_in=params_in)

    # Get parameters
    params = await physics_parameter.get_by_scene(db, scene_id=test_scene["id"])
    assert params is not None
    assert params.id == created_params.id
    assert params.scene_id == test_scene["id"]
    assert params.gravity == 9.81

@pytest.mark.asyncio
async def test_update_physics_parameters(
    db: AsyncSession,
    test_scene: Dict[str, Any]
):
    """Test updating physics parameters."""
    # Create test parameters
    params_in = PhysicsParameterCreate(
        scene_id=test_scene["id"],
        gravity=9.81,
        air_resistance=0.1,
        collision_elasticity=0.7,
        friction=0.3
    )
    params = await physics_parameter.create_with_scene(db, obj_in=params_in)

    # Update parameters
    params_update = PhysicsParameterUpdate(
        gravity=5.0,
        air_resistance=0.2
    )
    updated_params = await physics_parameter.update_by_scene(
        db,
        scene_id=test_scene["id"],
        obj_in=params_update
    )

    assert updated_params is not None
    assert updated_params.gravity == 5.0
    assert updated_params.air_resistance == 0.2
    assert updated_params.collision_elasticity == 0.7  # Unchanged
    assert updated_params.friction == 0.3  # Unchanged

@pytest.mark.asyncio
async def test_delete_physics_parameters(
    db: AsyncSession,
    test_scene: Dict[str, Any]
):
    """Test deleting physics parameters."""
    # Create test parameters
    params_in = PhysicsParameterCreate(
        scene_id=test_scene["id"],
        gravity=9.81,
        air_resistance=0.1,
        collision_elasticity=0.7,
        friction=0.3
    )
    params = await physics_parameter.create_with_scene(db, obj_in=params_in)

    # Delete parameters
    deleted_params = await physics_parameter.remove_by_scene(db, scene_id=test_scene["id"])
    assert deleted_params is not None
    assert deleted_params.id == params.id

    # Verify deletion
    params = await physics_parameter.get_by_scene(db, scene_id=test_scene["id"])
    assert params is None

@pytest.mark.asyncio
async def test_get_nonexistent_parameters(
    db: AsyncSession
):
    """Test getting nonexistent physics parameters."""
    params = await physics_parameter.get_by_scene(db, scene_id=999999)
    assert params is None

@pytest.mark.asyncio
async def test_update_nonexistent_parameters(
    db: AsyncSession
):
    """Test updating nonexistent physics parameters."""
    params_update = PhysicsParameterUpdate(gravity=5.0)
    updated_params = await physics_parameter.update_by_scene(
        db,
        scene_id=999999,
        obj_in=params_update
    )
    assert updated_params is None

@pytest.mark.asyncio
async def test_delete_nonexistent_parameters(
    db: AsyncSession
):
    """Test deleting nonexistent physics parameters."""
    deleted_params = await physics_parameter.remove_by_scene(db, scene_id=999999)
    assert deleted_params is None
