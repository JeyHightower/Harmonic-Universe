"""Universe API test fixtures."""

import pytest
from typing import Dict, Any
from app.models.core.universe import Universe
from app.models.core.user import User
import uuid

@pytest.fixture
def test_create_universe_data(test_user: User) -> Dict[str, Any]:
    """Get test data for creating a universe."""
    return {
        "name": f"New Universe {uuid.uuid4()}",
        "description": f"A new test universe created at {uuid.uuid4()}",
        "creator_id": test_user.id,
        "is_public": True,
        "metadata": {
            "genre": "fantasy",
            "theme": "medieval",
            "tags": ["new", "test", "universe"]
        }
    }

@pytest.fixture
def test_update_universe_data() -> Dict[str, Any]:
    """Get test data for updating a universe."""
    return {
        "name": f"Updated Universe {uuid.uuid4()}",
        "description": f"An updated test universe at {uuid.uuid4()}",
        "is_public": False,
        "metadata": {
            "genre": "sci-fi",
            "theme": "cyberpunk",
            "tags": ["updated", "test", "universe"]
        }
    }

@pytest.fixture
def test_universe_filters() -> Dict[str, Any]:
    """Get test universe filter parameters."""
    return {
        "skip": 0,
        "limit": 10,
        "creator_id": None,
        "is_public": True
    }

@pytest.fixture
def test_universe_sort() -> Dict[str, str]:
    """Get test universe sort parameters."""
    return {
        "sort_by": "created_at",
        "order": "desc"
    }

@pytest.fixture
def test_universe_search() -> Dict[str, str]:
    """Get test universe search parameters."""
    return {
        "search_term": "test",
        "search_fields": ["name", "description"]
    }
