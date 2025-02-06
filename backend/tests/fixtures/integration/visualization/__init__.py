"""Visualization integration test fixtures."""

import pytest
from typing import Dict, Any
import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.visualization.visualization import Visualization
from app.models.visualization.keyframe import Keyframe
from app.models.visualization.scene_object import SceneObject
from app.models.core.scene import Scene, RenderingMode, SceneObjectType

@pytest.fixture
async def test_visualization(db: AsyncSession, test_scene: Scene) -> Visualization:
    """Create a test visualization."""
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
    return viz

@pytest.fixture
async def test_keyframe(db: AsyncSession, test_visualization: Visualization) -> Keyframe:
    """Create a test keyframe."""
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
    return keyframe

@pytest.fixture
async def test_scene_object(db: AsyncSession, test_scene: Scene) -> SceneObject:
    """Create a test scene object."""
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
    return obj

@pytest.fixture
def test_render_data() -> Dict[str, Any]:
    """Test data for rendering."""
    return {
        "width": 1920,
        "height": 1080,
        "samples": 64,
        "max_bounces": 4,
        "environment_map": None,
        "background_color": [0.1, 0.1, 0.1]
    }

@pytest.fixture
def test_animation_data() -> Dict[str, Any]:
    """Test data for animation."""
    return {
        "duration": 10.0,
        "frame_rate": 60,
        "keyframes": [
            {
                "timestamp": 0.0,
                "position": {"x": 0, "y": 0, "z": 0},
                "rotation": {"x": 0, "y": 0, "z": 0},
                "scale": {"x": 1, "y": 1, "z": 1}
            },
            {
                "timestamp": 5.0,
                "position": {"x": 1, "y": 2, "z": 3},
                "rotation": {"x": 0, "y": 180, "z": 0},
                "scale": {"x": 2, "y": 2, "z": 2}
            }
        ]
    }
