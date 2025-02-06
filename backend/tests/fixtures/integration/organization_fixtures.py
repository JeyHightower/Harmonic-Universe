"""Organization test fixtures."""

import pytest
from typing import Dict

from app.models import Storyboard, Timeline

@pytest.fixture
def organization_test_data() -> Dict[str, str]:
    """Test data for organization endpoints."""
    return {
        "storyboard_name": "Test Storyboard",
        "storyboard_description": "A test storyboard",
        "timeline_name": "Test Timeline",
        "timeline_description": "A test timeline"
    }
