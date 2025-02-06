"""Physics test fixtures."""

import pytest
from typing import Dict, Any

from app.models import PhysicsParameter, PhysicsObject, PhysicsConstraint

@pytest.fixture
def physics_test_data() -> Dict[str, Any]:
    """Test data for physics endpoints."""
    return {
        "gravity": 9.81,
        "air_resistance": 0.1,
        "collision_elasticity": 0.8,
        "parameters": {
            "mass": 1.0,
            "velocity": [0, 0, 0],
            "position": [0, 0, 0]
        }
    }
