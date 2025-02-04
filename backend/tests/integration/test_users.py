from typing import Dict
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from fastapi import status

from app import crud
from app.core.config import settings
from app.schemas.user import UserCreate
from app.models.core.user import User
from app.core.security import verify_password

def test_create_user(client: TestClient, db: Session) -> None:
    """Test user creation."""
    data = {
        "email": "newuser@example.com",
        "password": "testpassword123",
        "full_name": "New User"
    }
    response = client.post("/api/users/", json=data)
    assert response.status_code == status.HTTP_201_CREATED
    content = response.json()
    assert content["email"] == data["email"]
    assert content["full_name"] == data["full_name"]
    assert "id" in content
    assert "password" not in content

def test_create_user_existing_email(client: TestClient, test_user: User) -> None:
    """Test creating user with existing email."""
    data = {
        "email": test_user.email,
        "password": "testpassword123",
        "full_name": "Another User"
    }
    response = client.post("/api/users/", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST

def test_create_user_existing_username(client: TestClient, test_user: User) -> None:
    """Test creating user with existing username."""
    data = {
        "email": "different@example.com",
        "password": "testpassword123",
        "full_name": "Another User",
        "username": test_user.username
    }
    response = client.post("/api/users/", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST

def test_get_users(client: TestClient, test_user: User, token_headers: Dict[str, str]) -> None:
    """Test getting list of users."""
    response = client.get("/api/users/", headers=token_headers)
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert isinstance(content, list)
    assert len(content) >= 1
    assert any(u["id"] == test_user.id for u in content)

def test_get_user(client: TestClient, test_user: User, token_headers: Dict[str, str]) -> None:
    """Test getting a specific user."""
    response = client.get(f"/api/users/{test_user.id}", headers=token_headers)
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert content["email"] == test_user.email
    assert content["full_name"] == test_user.full_name

def test_get_user_not_found(client: TestClient, token_headers: Dict[str, str]) -> None:
    """Test getting a non-existent user."""
    response = client.get("/api/users/999", headers=token_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_update_user(client: TestClient, test_user: User, token_headers: Dict[str, str]) -> None:
    """Test updating user information."""
    data = {
        "full_name": "Updated Name",
        "email": "updated@example.com"
    }
    response = client.put(f"/api/users/{test_user.id}", json=data, headers=token_headers)
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert content["full_name"] == data["full_name"]
    assert content["email"] == data["email"]

def test_update_user_not_found(client: TestClient, token_headers: Dict[str, str]) -> None:
    """Test updating a non-existent user."""
    data = {
        "full_name": "Updated Name",
        "email": "updated@example.com"
    }
    response = client.put("/api/users/999", json=data, headers=token_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_login_access_token(client: TestClient, test_user: User) -> None:
    """Test login with valid credentials."""
    data = {
        "username": test_user.email,
        "password": "testpassword"
    }
    response = client.post("/api/auth/login", data=data)
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert "access_token" in content
    assert content["token_type"] == "bearer"

def test_login_access_token_wrong_password(client: TestClient, test_user: User) -> None:
    """Test login with wrong password."""
    data = {
        "username": test_user.email,
        "password": "wrongpassword"
    }
    response = client.post("/api/auth/login", data=data)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_get_current_user(client: TestClient, test_user: User, token_headers: Dict[str, str]) -> None:
    """Test getting current user information."""
    response = client.get("/api/users/me", headers=token_headers)
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert content["email"] == test_user.email
    assert content["full_name"] == test_user.full_name

def test_update_password(client: TestClient, test_user: User, token_headers: Dict[str, str]) -> None:
    """Test updating user password."""
    data = {
        "current_password": "testpassword",
        "new_password": "newpassword123"
    }
    response = client.post("/api/users/me/password", json=data, headers=token_headers)
    assert response.status_code == status.HTTP_200_OK

    # Try logging in with new password
    login_data = {
        "username": test_user.email,
        "password": "newpassword123"
    }
    response = client.post("/api/auth/login", data=login_data)
    assert response.status_code == status.HTTP_200_OK

def test_update_password_wrong_current(client: TestClient, token_headers: Dict[str, str]) -> None:
    """Test updating password with wrong current password."""
    data = {
        "current_password": "wrongpassword",
        "new_password": "newpassword123"
    }
    response = client.post("/api/users/me/password", json=data, headers=token_headers)
    assert response.status_code == status.HTTP_400_BAD_REQUEST

def test_user_preferences(client: TestClient, test_user: User, token_headers: Dict[str, str]) -> None:
    """Test updating user preferences."""
    data = {
        "theme": "dark",
        "notifications_enabled": True,
        "language": "en"
    }
    response = client.put("/api/users/me/preferences", json=data, headers=token_headers)
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert content["preferences"]["theme"] == data["theme"]
    assert content["preferences"]["notifications_enabled"] == data["notifications_enabled"]
    assert content["preferences"]["language"] == data["language"]
