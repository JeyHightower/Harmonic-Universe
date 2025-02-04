"""Visualization test suite."""

import pytest
from typing import Dict, Any

from app.models import Visualization, Keyframe, SceneObject

# Register conftest.py for fixture sharing
pytest_plugins = ["tests.conftest"]

@pytest.fixture
def visualization_test_data() -> Dict[str, Any]:
    """Test data for visualization endpoints."""
    return {
        "name": "Test Visualization",
        "description": "A test visualization",
        "parameters": {
            "camera": {
                "position": [0, 0, 5],
                "target": [0, 0, 0],
                "up": [0, 1, 0]
            },
            "lighting": {
                "ambient": 0.2,
                "diffuse": 0.7,
                "specular": 0.5
            }
        }
    }
