"""Scene model test fixtures."""

import pytest
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.core.scene import Scene, RenderingMode, SceneObjectType
from app.models.core.universe import Universe
import uuid

@pytest.fixture
async def test_scene_data(test_universe: Universe) -> Dict[str, Any]:
    """Get test scene data."""
    return {
        "name": f"Test Scene {uuid.uuid4()}",
        "description": f"A test scene created at {uuid.uuid4()}",
        "universe_id": test_universe.id,
        "rendering_mode": RenderingMode.THREE_D,
        "physics_enabled": True,
        "music_enabled": True,
        "metadata": {
            "environment": "space",
            "time_of_day": "night",
            "weather": "clear",
            "tags": ["test", "demo", "scene"]
        }
    }

@pytest.fixture
async def test_scene(db: AsyncSession, test_scene_data: Dict[str, Any]) -> Scene:
    """Create a test scene."""
    scene = Scene(
        name=test_scene_data["name"],
        description=test_scene_data["description"],
        universe_id=test_scene_data["universe_id"],
        rendering_mode=test_scene_data["rendering_mode"],
        physics_enabled=test_scene_data["physics_enabled"],
        music_enabled=test_scene_data["music_enabled"],
        metadata=test_scene_data["metadata"]
    )
    db.add(scene)
    await db.commit()
    await db.refresh(scene)
    return scene

@pytest.fixture
async def test_2d_scene(db: AsyncSession, test_universe: Universe) -> Scene:
    """Create a test 2D scene."""
    scene_data = {
        "name": f"2D Scene {uuid.uuid4()}",
        "description": f"A 2D test scene created at {uuid.uuid4()}",
        "universe_id": test_universe.id,
        "rendering_mode": RenderingMode.TWO_D,
        "physics_enabled": False,
        "music_enabled": True,
        "metadata": {
            "environment": "forest",
            "time_of_day": "day",
            "weather": "sunny",
            "tags": ["2d", "test", "scene"]
        }
    }
    scene = Scene(**scene_data)
    db.add(scene)
    await db.commit()
    await db.refresh(scene)
    return scene
