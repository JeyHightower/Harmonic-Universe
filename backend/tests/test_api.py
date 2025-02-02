"""Test API endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from fastapi import status

from app.main import app
from app.core.config import settings
from app.models.user import User
from app.models.universe import Universe
from app.core.security import create_access_token

@pytest.fixture
def client():
    """Test client fixture."""
    return TestClient(app)

@pytest.fixture
def test_user(db_session: Session):
    """Create test user."""
    user = User(
        email="test@example.com",
        username="testuser",
        full_name="Test User",
        is_active=True,
        is_superuser=False,
        email_verified=True
    )
    user.password = "test-password"  # This will properly hash the password
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_universe(db_session: Session, test_user: User):
    """Create test universe."""
    universe = Universe(
        name="Test Universe",
        description="Test Description",
        creator_id=test_user.id
    )
    db_session.add(universe)
    db_session.commit()
    db_session.refresh(universe)
    return universe

@pytest.fixture
def token_headers(test_user: User):
    """Create authorization headers with token."""
    token = create_access_token(test_user.id)
    return {"Authorization": f"Bearer {token}"}

def test_health_check(client):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

def test_api_docs(client):
    """Test API documentation endpoints."""
    response = client.get("/docs")
    assert response.status_code == status.HTTP_200_OK
    response = client.get("/redoc")
    assert response.status_code == status.HTTP_200_OK

def test_create_user(client):
    """Test user creation endpoint."""
    data = {
        "email": "newuser@example.com",
        "password": "TestPassword123",
        "full_name": "New User",
        "username": "newuser123"
    }
    response = client.post(f"{settings.API_V1_STR}/users/register", json=data)
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["email"] == data["email"]
    assert response.json()["username"] == data["username"]

def test_login(client, test_user):
    """Test login endpoint."""
    data = {
        "username": test_user.email,
        "password": "test-password"
    }
    response = client.post(f"{settings.API_V1_STR}/auth/login", data=data)
    assert response.status_code == status.HTTP_200_OK
    assert "access_token" in response.json()

def test_create_universe(auth_client):
    """Test universe creation endpoint."""
    data = {
        "name": "New Universe",
        "description": "A new test universe",
        "physics_json": {},
        "music_parameters": {}
    }
    response = auth_client.post(f"{settings.API_V1_STR}/universes/", json=data)
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["name"] == data["name"]

def test_list_universes(auth_client, test_universe):
    """Test listing universes endpoint."""
    response = auth_client.get(f"{settings.API_V1_STR}/universes/")
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)
    assert len(response.json()) > 0

def test_get_universe(auth_client, test_universe):
    """Test getting specific universe endpoint."""
    response = auth_client.get(f"{settings.API_V1_STR}/universes/{test_universe.id}")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["id"] == str(test_universe.id)

def test_update_universe(auth_client, test_universe):
    """Test updating universe endpoint."""
    data = {
        "name": "Updated Universe",
        "description": "Updated description",
        "physics_json": {},
        "music_parameters": {}
    }
    response = auth_client.put(
        f"{settings.API_V1_STR}/universes/{test_universe.id}",
        json=data
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["name"] == data["name"]

def test_delete_universe(auth_client, test_universe):
    """Test deleting universe endpoint."""
    response = auth_client.delete(
        f"{settings.API_V1_STR}/universes/{test_universe.id}"
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT

def test_unauthorized_access(client):
    """Test unauthorized access to protected endpoints."""
    response = client.get(f"{settings.API_V1_STR}/universes/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_superuser_access(superuser_client):
    """Test superuser access to protected endpoints."""
    response = superuser_client.get(f"{settings.API_V1_STR}/users/")
    assert response.status_code == status.HTTP_200_OK
