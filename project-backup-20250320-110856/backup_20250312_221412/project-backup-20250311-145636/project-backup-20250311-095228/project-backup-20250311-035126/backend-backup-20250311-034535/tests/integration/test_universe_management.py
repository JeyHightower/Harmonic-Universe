"""Test suite for universe management functionality."""
import pytest
from app.models import Universe, UniverseAccess, Collaborator
from .factories import UserFactory, UniverseFactory


def test_universe_creation(client, auth_headers):
    """Test universe creation endpoint."""
    response = client.post(
        "/api/universes",
        json={
            "name": "New Universe",
            "description": "A test universe",
            "is_public": True,
            "max_participants": 10,
            "music_parameters": {"volume": 0.8},
            "visual_parameters": {"theme": "dark"},
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json["name"] == "New Universe"
    assert response.json["is_public"] is True

    universe = Universe.query.get(response.json["id"])
    assert universe is not None
    assert universe.name == "New Universe"
    assert universe.music_parameters == {"volume": 0.8}


def test_universe_update(client, universe, auth_headers):
    """Test universe update endpoint."""
    response = client.put(
        f"/api/universes/{universe.id}",
        json={
            "name": "Updated Universe",
            "description": "Updated description",
            "is_public": False,
            "max_participants": 5,
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json["name"] == "Updated Universe"
    assert response.json["is_public"] is False

    universe.refresh_from_db()
    assert universe.name == "Updated Universe"
    assert universe.max_participants == 5


def test_universe_delete(client, universe, auth_headers):
    """Test universe deletion endpoint."""
    response = client.delete(f"/api/universes/{universe.id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json["message"] == "Universe deleted successfully"

    assert Universe.query.get(universe.id) is None


def test_universe_list(client, universe, auth_headers):
    """Test universe listing endpoint."""
    response = client.get("/api/universes", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json["universes"], list)
    assert len(response.json["universes"]) > 0
    assert any(u["id"] == universe.id for u in response.json["universes"])


def test_universe_detail(client, universe, auth_headers):
    """Test universe detail endpoint."""
    response = client.get(f"/api/universes/{universe.id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json["id"] == universe.id
    assert response.json["name"] == universe.name
    assert response.json["description"] == universe.description


def test_universe_access_control(client, universe, auth_headers):
    """Test universe access control."""
    # Make universe private
    universe.is_public = False
    universe.save()

    # Create another user
    other_user = UserFactory()
    other_headers = {"Authorization": f"Bearer {other_user.generate_auth_token()}"}

    # Try to access with unauthorized user
    response = client.get(f"/api/universes/{universe.id}", headers=other_headers)
    assert response.status_code == 403


def test_universe_collaboration(client, universe, auth_headers):
    """Test universe collaboration features."""
    # Create collaborator
    collaborator = UserFactory()

    # Add collaborator
    response = client.post(
        f"/api/universes/{universe.id}/collaborators",
        json={"user_id": collaborator.id, "role": "editor"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json["role"] == "editor"

    # Verify collaborator was added
    collab = Collaborator.query.filter_by(
        universe_id=universe.id, user_id=collaborator.id
    ).first()
    assert collab is not None
    assert collab.role == "editor"


def test_universe_settings(client, universe, auth_headers):
    """Test universe settings management."""
    new_settings = {
        "music_parameters": {"volume": 0.5, "background_music": "space_theme.mp3"},
        "visual_parameters": {"theme": "light", "particle_effects": True},
    }

    response = client.put(
        f"/api/universes/{universe.id}/settings",
        json=new_settings,
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json["music_parameters"] == new_settings["music_parameters"]
    assert response.json["visual_parameters"] == new_settings["visual_parameters"]

    universe.refresh_from_db()
    assert universe.music_parameters == new_settings["music_parameters"]
    assert universe.visual_parameters == new_settings["visual_parameters"]


def test_universe_search(client, universe, auth_headers):
    """Test universe search functionality."""
    response = client.get("/api/universes/search?q=test", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json["results"], list)


def test_universe_statistics(client, universe, auth_headers):
    """Test universe statistics endpoint."""
    response = client.get(f"/api/universes/{universe.id}/stats", headers=auth_headers)
    assert response.status_code == 200
    assert "collaborators_count" in response.json
    assert "storyboards_count" in response.json
    assert "scenes_count" in response.json
    assert "last_activity" in response.json


def test_universe_export(client, universe, auth_headers):
    """Test universe export functionality."""
    response = client.get(f"/api/universes/{universe.id}/export", headers=auth_headers)
    assert response.status_code == 200
    assert "universe_data" in response.json
    assert response.json["universe_data"]["id"] == universe.id
    assert "storyboards" in response.json["universe_data"]
    assert "scenes" in response.json["universe_data"]


def test_universe_import(client, auth_headers):
    """Test universe import functionality."""
    universe_data = {
        "name": "Imported Universe",
        "description": "Imported from backup",
        "is_public": True,
        "storyboards": [],
        "scenes": [],
    }

    response = client.post(
        "/api/universes/import",
        json={"universe_data": universe_data},
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json["name"] == "Imported Universe"
    assert response.json["description"] == "Imported from backup"


def test_universe_activity_log(client, universe, auth_headers):
    """Test universe activity logging."""
    response = client.get(
        f"/api/universes/{universe.id}/activity", headers=auth_headers
    )
    assert response.status_code == 200
    assert "activities" in response.json
    assert isinstance(response.json["activities"], list)
