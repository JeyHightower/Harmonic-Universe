"""Integration tests for user API endpoints."""

from typing import Dict
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app import crud
from app.core.config import settings
from app.schemas.user import UserCreate
from app.tests.utils.utils import random_email, random_lower_string

def test_create_user(
    client: TestClient, superuser_token_headers: Dict[str, str], db: Session
) -> None:
    """Test creating a user."""
    email = random_email()
    password = random_lower_string()
    data = {
        "email": email,
        "password": password,
        "full_name": random_lower_string(),
    }
    response = client.post(
        f"{settings.API_V1_STR}/users/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    created_user = response.json()
    assert created_user["email"] == email
    assert "password" not in created_user

def test_get_users(
    client: TestClient, superuser_token_headers: Dict[str, str], db: Session
) -> None:
    """Test retrieving users."""
    response = client.get(
        f"{settings.API_V1_STR}/users/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    users = response.json()
    assert isinstance(users, list)
    assert len(users) > 0

def test_get_user_me(
    client: TestClient, superuser_token_headers: Dict[str, str], db: Session
) -> None:
    """Test getting current user."""
    response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    current_user = response.json()
    assert current_user["is_active"] is True
    assert current_user["is_superuser"] is True
    assert "email" in current_user

def test_update_user_me(
    client: TestClient, superuser_token_headers: Dict[str, str], db: Session
) -> None:
    """Test updating current user."""
    new_name = random_lower_string()
    data = {"full_name": new_name}
    response = client.put(
        f"{settings.API_V1_STR}/users/me",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    updated_user = response.json()
    assert updated_user["full_name"] == new_name

def test_get_user_by_id(
    client: TestClient, superuser_token_headers: Dict[str, str], db: Session
) -> None:
    """Test getting a user by ID."""
    user = crud.user.get_by_email(db, email="admin@example.com")
    response = client.get(
        f"{settings.API_V1_STR}/users/{user.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    api_user = response.json()
    assert api_user["email"] == user.email

def test_update_user(
    client: TestClient, superuser_token_headers: Dict[str, str], db: Session
) -> None:
    """Test updating a user."""
    user = crud.user.get_by_email(db, email="admin@example.com")
    new_name = random_lower_string()
    data = {"full_name": new_name}
    response = client.put(
        f"{settings.API_V1_STR}/users/{user.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    updated_user = response.json()
    assert updated_user["full_name"] == new_name

def test_create_user_existing_email(
    client: TestClient, superuser_token_headers: Dict[str, str], db: Session
) -> None:
    """Test creating a user with existing email."""
    email = "admin@example.com"
    password = random_lower_string()
    data = {
        "email": email,
        "password": password,
        "full_name": random_lower_string(),
    }
    response = client.post(
        f"{settings.API_V1_STR}/users/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]
