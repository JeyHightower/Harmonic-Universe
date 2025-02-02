import pytest
from fastapi import status
from app.models.universe import Universe

def test_create_universe(client, auth_headers):
    """Test creating a new universe."""
    data = {
        "name": "New Universe",
        "description": "A new test universe"
    }
    response = client.post("/api/universes/", json=data, headers=auth_headers)
    assert response.status_code == status.HTTP_201_CREATED
    content = response.json()
    assert content["name"] == data["name"]
    assert content["description"] == data["description"]

def test_get_universe(client, auth_headers, test_universe):
    """Test getting a specific universe."""
    response = client.get(f"/api/universes/{test_universe.id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert content["name"] == test_universe.name
    assert content["description"] == test_universe.description

def test_list_universes(client, auth_headers, test_universe):
    """Test listing all universes."""
    response = client.get("/api/universes/", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
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

def test_unauthorized_access(client, test_universe):
    """Test unauthorized access to universe endpoints."""
    # Try to get universe without auth
    response = client.get(f"/api/universes/{test_universe.id}")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_universe_not_found(client, auth_headers):
    """Test accessing non-existent universe."""
    response = client.get("/api/universes/99999", headers=auth_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND
