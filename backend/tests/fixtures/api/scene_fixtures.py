"""Scene API test fixtures."""

import pytest
from typing import Dict, Any
from app.models.core.scene import Scene, RenderingMode
from app.models.core.universe import Universe
import uuid

@pytest.fixture
def test_create_scene_data(test_universe: Universe) -> Dict[str, Any]:
    """Get test data for creating a scene."""
    return {
        "name": f"New Scene {uuid.uuid4()}",
        "description": f"A new test scene created at {uuid.uuid4()}",
        "universe_id": test_universe.id,
        "rendering_mode": RenderingMode.THREE_D,
        "physics_enabled": True,
        "music_enabled": True,
        "metadata": {
            "environment": "space",
            "time_of_day": "night",
            "weather": "clear",
            "tags": ["new", "test", "scene"]
        }
    }

@pytest.fixture
def test_update_scene_data() -> Dict[str, Any]:
    """Get test data for updating a scene."""
    return {
        "name": f"Updated Scene {uuid.uuid4()}",
        "description": f"An updated test scene at {uuid.uuid4()}",
        "rendering_mode": RenderingMode.TWO_D,
        "physics_enabled": False,
        "music_enabled": True,
        "metadata": {
            "environment": "forest",
            "time_of_day": "day",
            "weather": "sunny",
            "tags": ["updated", "test", "scene"]
        }
    }

@pytest.fixture
def test_scene_filters() -> Dict[str, Any]:
    """Get test scene filter parameters."""
    return {
        "skip": 0,
        "limit": 10,
        "universe_id": None,
        "rendering_mode": None,
        "physics_enabled": None,
        "music_enabled": None
    }

@pytest.fixture
def test_scene_sort() -> Dict[str, str]:
    """Get test scene sort parameters."""
    return {
        "sort_by": "created_at",
        "order": "desc"
    }

@pytest.fixture
def test_scene_search() -> Dict[str, str]:
    """Get test scene search parameters."""
    return {
        "search_term": "test",
        "search_fields": ["name", "description"]
    }
