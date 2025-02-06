"""Visualization model tests."""

import pytest
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.visualization.visualization import Visualization
from app.models.visualization.keyframe import Keyframe
from app.models.visualization.scene_object import SceneObject
from app.models.core.scene import Scene, RenderingMode, SceneObjectType

@pytest.mark.asyncio
async def test_create_visualization(db: AsyncSession, test_scene: Scene):
    """Test creating a visualization."""
    viz = Visualization(
        scene_id=test_scene.id,
        name="Test Visualization",
        description="A test visualization",
        rendering_mode=RenderingMode.THREE_D,
        width=1920,
        height=1080,
        frame_rate=60,
        duration=10.0
    )
    db.add(viz)
    await db.commit()
    await db.refresh(viz)

    assert viz.id is not None
    assert viz.scene_id == test_scene.id
    assert viz.name == "Test Visualization"
    assert viz.rendering_mode == RenderingMode.THREE_D
    assert viz.width == 1920
    assert viz.height == 1080

@pytest.mark.asyncio
async def test_create_keyframe(db: AsyncSession, test_visualization: Visualization):
    """Test creating a keyframe."""
    keyframe = Keyframe(
        visualization_id=test_visualization.id,
        timestamp=0.0,
        camera_position={"x": 0, "y": 0, "z": 5},
        camera_target={"x": 0, "y": 0, "z": 0},
        camera_up={"x": 0, "y": 1, "z": 0},
        fov=75,
        interpolation_mode="linear"
    )
    db.add(keyframe)
    await db.commit()
    await db.refresh(keyframe)

    assert keyframe.id is not None
    assert keyframe.visualization_id == test_visualization.id
    assert keyframe.timestamp == 0.0
    assert keyframe.camera_position == {"x": 0, "y": 0, "z": 5}
    assert keyframe.fov == 75

@pytest.mark.asyncio
async def test_create_scene_object(db: AsyncSession, test_scene: Scene):
    """Test creating a scene object."""
    obj = SceneObject(
        scene_id=test_scene.id,
        name="Test Object",
        object_type=SceneObjectType.MESH,
        position={"x": 0, "y": 0, "z": 0},
        rotation={"x": 0, "y": 0, "z": 0},
        scale={"x": 1, "y": 1, "z": 1},
        geometry={
            "type": "box",
            "width": 1,
            "height": 1,
            "depth": 1
        },
        material={
            "type": "standard",
            "color": "#ffffff",
            "metalness": 0.5,
            "roughness": 0.5
        }
    )
    db.add(obj)
    await db.commit()
    await db.refresh(obj)

    assert obj.id is not None
    assert obj.scene_id == test_scene.id
    assert obj.name == "Test Object"
    assert obj.object_type == SceneObjectType.MESH
    assert obj.geometry["type"] == "box"

@pytest.mark.asyncio
async def test_visualization_relationships(
    db: AsyncSession,
    test_visualization: Visualization,
    test_keyframe: Keyframe
):
    """Test relationships between visualization models."""
    # Refresh visualization to load relationships
    await db.refresh(test_visualization)

    # Test keyframes relationship
    assert test_visualization.keyframes is not None
    assert len(test_visualization.keyframes) > 0
    assert test_visualization.keyframes[0].id == test_keyframe.id

@pytest.mark.asyncio
async def test_scene_object_relationships(
    db: AsyncSession,
    test_scene: Scene,
    test_scene_object: SceneObject
):
    """Test relationships between scene and scene objects."""
    # Refresh scene to load relationships
    await db.refresh(test_scene)

    # Test scene objects relationship
    assert test_scene.scene_objects is not None
    assert len(test_scene.scene_objects) > 0
    assert test_scene.scene_objects[0].id == test_scene_object.id

@pytest.mark.asyncio
async def test_update_visualization(db: AsyncSession, test_visualization: Visualization):
    """Test updating a visualization."""
    # Update visualization attributes
    test_visualization.name = "Updated Visualization"
    test_visualization.width = 3840
    test_visualization.height = 2160
    await db.commit()
    await db.refresh(test_visualization)

    assert test_visualization.name == "Updated Visualization"
    assert test_visualization.width == 3840
    assert test_visualization.height == 2160

@pytest.mark.asyncio
async def test_update_keyframe(db: AsyncSession, test_keyframe: Keyframe):
    """Test updating a keyframe."""
    # Update keyframe attributes
    test_keyframe.timestamp = 1.0
    test_keyframe.camera_position = {"x": 1, "y": 2, "z": 3}
    test_keyframe.fov = 90
    await db.commit()
    await db.refresh(test_keyframe)

    assert test_keyframe.timestamp == 1.0
    assert test_keyframe.camera_position == {"x": 1, "y": 2, "z": 3}
    assert test_keyframe.fov == 90

@pytest.mark.asyncio
async def test_update_scene_object(db: AsyncSession, test_scene_object: SceneObject):
    """Test updating a scene object."""
    # Update scene object attributes
    test_scene_object.name = "Updated Object"
    test_scene_object.position = {"x": 1, "y": 2, "z": 3}
    test_scene_object.geometry = {
        "type": "sphere",
        "radius": 1
    }
    await db.commit()
    await db.refresh(test_scene_object)

    assert test_scene_object.name == "Updated Object"
    assert test_scene_object.position == {"x": 1, "y": 2, "z": 3}
    assert test_scene_object.geometry["type"] == "sphere"

@pytest.mark.asyncio
async def test_delete_visualization_cascade(
    db: AsyncSession,
    test_visualization: Visualization,
    test_keyframe: Keyframe
):
    """Test deleting a visualization cascades to keyframes."""
    # Delete visualization
    await db.delete(test_visualization)
    await db.commit()

    # Verify visualization and keyframe are deleted
    assert await db.get(Visualization, test_visualization.id) is None
    assert await db.get(Keyframe, test_keyframe.id) is None
