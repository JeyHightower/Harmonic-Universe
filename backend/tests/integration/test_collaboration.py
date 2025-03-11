"""Test suite for collaboration features."""
import pytest
from app.models import Universe, UniverseAccess, Collaborator, Activity
from .factories import UserFactory, UniverseFactory, StoryboardFactory


def test_collaborator_invite(client, universe, auth_headers):
    """Test collaborator invitation."""
    collaborator = UserFactory()

    response = client.post(
        f"/api/universes/{universe.id}/collaborators",
        json={
            "user_id": collaborator.id,
            "role": "editor",
            "permissions": ["edit", "comment"],
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json["role"] == "editor"

    collab = Collaborator.query.filter_by(
        universe_id=universe.id, user_id=collaborator.id
    ).first()
    assert collab is not None
    assert collab.role == "editor"
    assert "edit" in collab.permissions


def test_collaborator_permissions(client, universe):
    """Test collaborator permission enforcement."""
    owner = UserFactory()
    editor = UserFactory()
    viewer = UserFactory()

    # Setup collaborators
    universe.user = owner
    Collaborator.create(universe=universe, user=editor, role="editor")
    Collaborator.create(universe=universe, user=viewer, role="viewer")

    # Test editor permissions
    editor_headers = {"Authorization": f"Bearer {editor.generate_auth_token()}"}
    edit_response = client.put(
        f"/api/universes/{universe.id}",
        json={"name": "Updated Universe"},
        headers=editor_headers,
    )
    assert edit_response.status_code == 200

    # Test viewer permissions
    viewer_headers = {"Authorization": f"Bearer {viewer.generate_auth_token()}"}
    view_response = client.put(
        f"/api/universes/{universe.id}",
        json={"name": "Viewer Update"},
        headers=viewer_headers,
    )
    assert view_response.status_code == 403


def test_activity_tracking(client, universe, auth_headers):
    """Test activity tracking."""
    # Perform some actions
    client.put(
        f"/api/universes/{universe.id}",
        json={"name": "Updated Universe"},
        headers=auth_headers,
    )

    # Get activity log
    response = client.get(
        f"/api/universes/{universe.id}/activity", headers=auth_headers
    )
    assert response.status_code == 200
    assert len(response.json["activities"]) > 0

    latest = response.json["activities"][0]
    assert latest["action"] == "update"
    assert latest["target_type"] == "universe"
    assert latest["target_id"] == universe.id


def test_real_time_collaboration(authenticated_websocket_client, scene, user):
    """Test real-time collaboration features."""
    # Join scene
    authenticated_websocket_client.emit("join_scene", {"scene_id": scene.id})
    authenticated_websocket_client.get_received()

    # Send edit operation
    edit = {
        "type": "update",
        "target": "scene",
        "properties": {"name": "Collaborative Edit"},
    }
    authenticated_websocket_client.emit(
        "edit_operation", {"scene_id": scene.id, "operation": edit, "user_id": user.id}
    )

    # Verify edit broadcast
    received = authenticated_websocket_client.get_received()
    assert any(msg["name"] == "edit_applied" for msg in received)


def test_conflict_resolution(authenticated_websocket_client, scene):
    """Test conflict resolution in collaborative editing."""
    # Join scene
    authenticated_websocket_client.emit("join_scene", {"scene_id": scene.id})
    authenticated_websocket_client.get_received()

    # Send conflicting edits
    edit1 = {
        "type": "update",
        "target": "scene",
        "properties": {"name": "Edit 1"},
        "timestamp": 1000,
    }
    edit2 = {
        "type": "update",
        "target": "scene",
        "properties": {"name": "Edit 2"},
        "timestamp": 999,  # Earlier timestamp
    }

    authenticated_websocket_client.emit(
        "edit_operation", {"scene_id": scene.id, "operation": edit1}
    )
    authenticated_websocket_client.emit(
        "edit_operation", {"scene_id": scene.id, "operation": edit2}
    )

    # Verify later edit prevailed
    scene.refresh_from_db()
    assert scene.name == "Edit 1"


def test_presence_awareness(authenticated_websocket_client, scene, user):
    """Test user presence awareness."""
    # Join scene
    authenticated_websocket_client.emit("join_scene", {"scene_id": scene.id})
    received = authenticated_websocket_client.get_received()

    # Verify presence broadcast
    presence_msg = next(msg for msg in received if msg["name"] == "presence_update")
    assert presence_msg is not None
    users = presence_msg["args"][0]["users"]
    assert any(u["id"] == user.id for u in users)
    assert any("cursor_position" in u for u in users)


def test_collaborative_undo_redo(authenticated_websocket_client, scene):
    """Test collaborative undo/redo functionality."""
    # Join scene
    authenticated_websocket_client.emit("join_scene", {"scene_id": scene.id})
    authenticated_websocket_client.get_received()

    # Perform edit
    edit = {"type": "update", "target": "scene", "properties": {"name": "Test Edit"}}
    authenticated_websocket_client.emit(
        "edit_operation", {"scene_id": scene.id, "operation": edit}
    )

    # Undo
    authenticated_websocket_client.emit("undo", {"scene_id": scene.id})
    received = authenticated_websocket_client.get_received()
    assert any(msg["name"] == "edit_undone" for msg in received)

    # Redo
    authenticated_websocket_client.emit("redo", {"scene_id": scene.id})
    received = authenticated_websocket_client.get_received()
    assert any(msg["name"] == "edit_redone" for msg in received)


def test_access_control_inheritance(client, universe, auth_headers):
    """Test access control inheritance for nested resources."""
    storyboard = StoryboardFactory(universe=universe)
    scene = SceneFactory(storyboard=storyboard)

    # Create a viewer
    viewer = UserFactory()
    Collaborator.create(universe=universe, user=viewer, role="viewer")
    viewer_headers = {"Authorization": f"Bearer {viewer.generate_auth_token()}"}

    # Verify inherited access
    response = client.get(f"/api/scenes/{scene.id}", headers=viewer_headers)
    assert response.status_code == 200

    # Verify inherited restrictions
    edit_response = client.put(
        f"/api/scenes/{scene.id}", json={"name": "Viewer Edit"}, headers=viewer_headers
    )
    assert edit_response.status_code == 403


def test_collaboration_statistics(client, universe, auth_headers):
    """Test collaboration statistics tracking."""
    response = client.get(
        f"/api/universes/{universe.id}/collaboration-stats", headers=auth_headers
    )
    assert response.status_code == 200
    assert "total_collaborators" in response.json
    assert "active_sessions" in response.json
    assert "edit_history" in response.json


def test_comment_system(client, scene, auth_headers):
    """Test collaborative commenting system."""
    # Add comment
    response = client.post(
        f"/api/scenes/{scene.id}/comments",
        json={"content": "Test comment", "position": {"x": 100, "y": 100}},
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json["content"] == "Test comment"

    # Get comments
    response = client.get(f"/api/scenes/{scene.id}/comments", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json["comments"]) > 0

    # Reply to comment
    comment_id = response.json["comments"][0]["id"]
    response = client.post(
        f"/api/comments/{comment_id}/replies",
        json={"content": "Test reply"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json["content"] == "Test reply"
