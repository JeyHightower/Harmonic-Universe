"""Authentication API test fixtures."""

import pytest
from typing import Dict, Any
from datetime import timedelta
from app.core.security import create_access_token
from app.models.core.user import User

@pytest.fixture
def auth_test_data() -> Dict[str, str]:
    """Test data for auth endpoints."""
    return {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "newpass123"
    }

@pytest.fixture
def test_token_data(test_user: User) -> Dict[str, Any]:
    """Get test token data."""
    return {
        "sub": str(test_user.id),
        "exp": None,  # Will be set by create_access_token
        "type": "access"
    }

@pytest.fixture
def test_access_token(test_user: User) -> str:
    """Create a test access token."""
    return create_access_token(test_user.id)

@pytest.fixture
def test_expired_token(test_user: User) -> str:
    """Create an expired test token."""
    return create_access_token(
        test_user.id,
        expires_delta=timedelta(microseconds=1)
    )

@pytest.fixture
def test_auth_headers(test_access_token: str) -> Dict[str, str]:
    """Create test authorization headers."""
    return {"Authorization": f"Bearer {test_access_token}"}

@pytest.fixture
def test_invalid_token() -> str:
    """Get an invalid token."""
    return "invalid.token.string"

@pytest.fixture
def test_invalid_auth_headers() -> Dict[str, str]:
    """Create invalid authorization headers."""
    return {"Authorization": "Bearer invalid.token.string"}

@pytest.fixture
def test_missing_auth_headers() -> Dict[str, str]:
    """Create headers with missing authorization."""
    return {"X-Other-Header": "value"}
