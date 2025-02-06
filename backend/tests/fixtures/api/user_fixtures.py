"""User API test fixtures."""

import pytest
from typing import Dict, Any
from app.models.core.user import User
import uuid

@pytest.fixture
def test_create_user_data() -> Dict[str, Any]:
    """Get test data for creating a user."""
    return {
        "email": f"new_user_{uuid.uuid4()}@example.com",
        "password": "newuserpass123",
        "full_name": f"New Test User {uuid.uuid4()}",
        "is_active": True,
        "is_superuser": False
    }

@pytest.fixture
def test_update_user_data() -> Dict[str, Any]:
    """Get test data for updating a user."""
    return {
        "full_name": f"Updated User {uuid.uuid4()}",
        "password": "updatedpass123",
        "email": f"updated_{uuid.uuid4()}@example.com"
    }

@pytest.fixture
def test_user_filters() -> Dict[str, Any]:
    """Get test user filter parameters."""
    return {
        "skip": 0,
        "limit": 10,
        "email": None,
        "is_active": True,
        "is_superuser": False
    }

@pytest.fixture
def test_user_sort() -> Dict[str, str]:
    """Get test user sort parameters."""
    return {
        "sort_by": "created_at",
        "order": "desc"
    }

@pytest.fixture
def test_user_search() -> Dict[str, str]:
    """Get test user search parameters."""
    return {
        "search_term": "test",
        "search_fields": ["email", "full_name"]
    }
