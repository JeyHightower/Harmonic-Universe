"""Authentication test suite."""

import pytest
from typing import Dict

from app.models import User

# Register conftest.py for fixture sharing
pytest_plugins = ["tests.conftest"]

@pytest.fixture
def auth_test_data() -> Dict[str, str]:
    """Test data for auth endpoints."""
    return {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "newpass123"
    }
