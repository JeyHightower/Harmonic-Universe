"""Core test suite."""

import pytest
from typing import Dict

from app.models import User, Universe, Scene

# Register conftest.py for fixture sharing
pytest_plugins = ["tests.conftest"]

@pytest.fixture
def core_test_data() -> Dict[str, str]:
    """Test data for core endpoints."""
    return {
        "universe_name": "Test Universe",
        "universe_description": "A test universe for testing",
        "scene_name": "Test Scene",
        "scene_description": "A test scene for testing"
    }
