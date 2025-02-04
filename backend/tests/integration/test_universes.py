from typing import Dict
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from fastapi import status

from app import crud
from app.core.config import settings
from app.schemas.universe import UniverseCreate, UniverseUpdate
from app.models.user import User
from app.models.universe import Universe

def test_create_universe(client, auth_headers):
    """Test creating a new universe."""
    data = {
        "name": "Test Universe",
        "description": "A test universe description"
    }
    response = client.post("/api/universes/", json=data, headers=auth_headers)
    assert response.status_code == status.HTTP_201_CREATED
    content = response.json()
    assert content["name"] == data["name"]
    assert content["description"] == data["description"]
    assert "id" in content

def test_get_universe(client, auth_headers, test_universe):
    """Test getting a specific universe."""
    response = client.get(f"/api/universes/{test_universe.id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert content["name"] == test_universe.name
    assert content["description"] == test_universe.description

def test_get_universe_not_found(client, auth_headers):
    """Test getting a non-existent universe."""
    response = client.get("/api/universes/999", headers=auth_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_get_universes(client, auth_headers, test_universe):
    """Test getting all universes."""
    response = client.get("/api/universes/", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert isinstance(content, list)
    assert len(content) >= 1
    assert any(u["id"] == test_universe.id for u in content)

def test_update_universe(client, auth_headers, test_universe):
    """Test updating a universe."""
    data = {
        "name": "Updated Universe",
        "description": "Updated description"
    }
    response = client.put(
        f"/api/universes/{test_universe.id}",
        json=data,
        headers=auth_headers
    )
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert content["name"] == data["name"]
    assert content["description"] == data["description"]

def test_delete_universe(client, auth_headers, test_universe):
    """Test deleting a universe."""
    response = client.delete(
        f"/api/universes/{test_universe.id}",
        headers=auth_headers
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify deletion
    response = client.get(f"/api/universes/{test_universe.id}", headers=auth_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_get_universe_scenes(client, auth_headers, test_universe, test_scene):
    """Test getting scenes in a universe."""
    response = client.get(
        f"/api/universes/{test_universe.id}/scenes",
        headers=auth_headers
    )
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert isinstance(content, list)
    assert len(content) >= 1
    assert any(s["id"] == test_scene.id for s in content)

def test_unauthorized_access(client):
    """Test unauthorized access to universe endpoints."""
    response = client.get("/api/universes/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_create_universe_validation(client, auth_headers):
    """Test universe creation with invalid data."""
    data = {
        "name": "",  # Empty name should fail
        "description": "Test description"
    }
    response = client.post("/api/universes/", json=data, headers=auth_headers)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_update_universe_not_found(client, auth_headers):
    """Test updating a non-existent universe."""
    data = {
        "name": "Updated Universe",
        "description": "Updated description"
    }
    response = client.put("/api/universes/999", json=data, headers=auth_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_universe_not_found(client, auth_headers):
    """Test deleting a non-existent universe."""
    response = client.delete("/api/universes/999", headers=auth_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND
