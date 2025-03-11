"""Test suite for WebSocket functionality."""
import pytest
import json
from app.models import Scene, PhysicsObject
from app.websockets import socketio
from .factories import (
    UserFactory,
    UniverseFactory,
    StoryboardFactory,
    SceneFactory,
    PhysicsObjectFactory,
)


def test_websocket_connection(websocket_client):
    """Test basic WebSocket connection."""
    connected = websocket_client.is_connected()
    assert connected


def test_websocket_authentication(app, user):
    """Test WebSocket authentication."""
    # Try connecting without auth
    client = socketio.test_client(app)
    assert not client.is_connected()

    # Connect with auth token
    auth_client = socketio.test_client(
        app, headers={"Authorization": f"Bearer {user.generate_auth_token()}"}
    )
    assert auth_client.is_connected()


def test_scene_join(authenticated_websocket_client, scene):
    """Test joining a scene room."""
    authenticated_websocket_client.emit("join_scene", {"scene_id": scene.id})
    received = authenticated_websocket_client.get_received()
    assert len(received) > 0
    assert received[0]["name"] == "scene_joined"
    assert received[0]["args"][0]["scene_id"] == scene.id


def test_scene_leave(authenticated_websocket_client, scene):
    """Test leaving a scene room."""
    # First join
    authenticated_websocket_client.emit("join_scene", {"scene_id": scene.id})
    authenticated_websocket_client.get_received()  # Clear received

    # Then leave
    authenticated_websocket_client.emit("leave_scene", {"scene_id": scene.id})
    received = authenticated_websocket_client.get_received()
    assert len(received) > 0
    assert received[0]["name"] == "scene_left"
    assert received[0]["args"][0]["scene_id"] == scene.id


def test_physics_update(authenticated_websocket_client, scene, physics_object):
    """Test physics state updates."""
    # Join scene
    authenticated_websocket_client.emit("join_scene", {"scene_id": scene.id})
    authenticated_websocket_client.get_received()  # Clear received

    # Send physics update
    new_state = {
        "id": physics_object.id,
        "position": {"x": 100, "y": 100},
        "velocity": {"x": 1, "y": 0},
    }
    authenticated_websocket_client.emit(
        "physics_update",
        {"scene_id": scene.id, "object_id": physics_object.id, "state": new_state},
    )

    # Verify update was broadcast
    received = authenticated_websocket_client.get_received()
    assert len(received) > 0
    assert received[0]["name"] == "physics_state"
    assert received[0]["args"][0]["object_id"] == physics_object.id


def test_collaborative_editing(authenticated_websocket_client, scene):
    """Test collaborative editing features."""
    # Join scene
    authenticated_websocket_client.emit("join_scene", {"scene_id": scene.id})
    authenticated_websocket_client.get_received()  # Clear received

    # Send edit operation
    edit = {
        "type": "update",
        "target": "scene",
        "properties": {"name": "Updated Scene"},
    }
    authenticated_websocket_client.emit(
        "edit_operation", {"scene_id": scene.id, "operation": edit}
    )

    # Verify edit was broadcast
    received = authenticated_websocket_client.get_received()
    assert len(received) > 0
    assert received[0]["name"] == "edit_applied"
    assert received[0]["args"][0]["operation"] == edit


def test_cursor_position(authenticated_websocket_client, scene):
    """Test cursor position broadcasting."""
    # Join scene
    authenticated_websocket_client.emit("join_scene", {"scene_id": scene.id})
    authenticated_websocket_client.get_received()  # Clear received

    # Send cursor position
    position = {"x": 100, "y": 100}
    authenticated_websocket_client.emit(
        "cursor_move", {"scene_id": scene.id, "position": position}
    )

    # Verify position was broadcast
    received = authenticated_websocket_client.get_received()
    assert len(received) > 0
    assert received[0]["name"] == "cursor_moved"
    assert received[0]["args"][0]["position"] == position


def test_selection_sync(authenticated_websocket_client, scene, physics_object):
    """Test selection synchronization."""
    # Join scene
    authenticated_websocket_client.emit("join_scene", {"scene_id": scene.id})
    authenticated_websocket_client.get_received()  # Clear received

    # Send selection update
    selection = {"type": "object", "id": physics_object.id}
    authenticated_websocket_client.emit(
        "selection_change", {"scene_id": scene.id, "selection": selection}
    )

    # Verify selection was broadcast
    received = authenticated_websocket_client.get_received()
    assert len(received) > 0
    assert received[0]["name"] == "selection_changed"
    assert received[0]["args"][0]["selection"] == selection


def test_presence_tracking(authenticated_websocket_client, scene, user):
    """Test user presence tracking."""
    # Join scene
    authenticated_websocket_client.emit("join_scene", {"scene_id": scene.id})
    received = authenticated_websocket_client.get_received()

    # Verify presence update
    presence_msg = next(msg for msg in received if msg["name"] == "presence_update")
    assert presence_msg is not None
    assert user.id in [u["id"] for u in presence_msg["args"][0]["users"]]


def test_error_handling(authenticated_websocket_client):
    """Test WebSocket error handling."""
    # Try to join non-existent scene
    authenticated_websocket_client.emit("join_scene", {"scene_id": 9999})
    received = authenticated_websocket_client.get_received()
    assert len(received) > 0
    assert received[0]["name"] == "error"
    assert "scene not found" in received[0]["args"][0]["message"].lower()


def test_reconnection_handling(app, user, scene):
    """Test WebSocket reconnection handling."""
    # First connection
    client1 = socketio.test_client(
        app, headers={"Authorization": f"Bearer {user.generate_auth_token()}"}
    )
    client1.emit("join_scene", {"scene_id": scene.id})
    client1.get_received()

    # Simulate disconnect
    client1.disconnect()

    # Reconnect
    client2 = socketio.test_client(
        app, headers={"Authorization": f"Bearer {user.generate_auth_token()}"}
    )
    assert client2.is_connected()

    # Should automatically rejoin previous rooms
    received = client2.get_received()
    assert any(msg["name"] == "scene_joined" for msg in received)


def test_broadcast_filtering(app, scene):
    """Test broadcast message filtering."""
    # Create two clients
    user1 = UserFactory()
    user2 = UserFactory()

    client1 = socketio.test_client(
        app, headers={"Authorization": f"Bearer {user1.generate_auth_token()}"}
    )
    client2 = socketio.test_client(
        app, headers={"Authorization": f"Bearer {user2.generate_auth_token()}"}
    )

    # Only client1 joins the scene
    client1.emit("join_scene", {"scene_id": scene.id})
    client1.get_received()

    # Send update
    client1.emit(
        "physics_update",
        {"scene_id": scene.id, "object_id": 1, "state": {"position": {"x": 0, "y": 0}}},
    )

    # Verify only client1 received the update
    assert len(client1.get_received()) > 0
    assert len(client2.get_received()) == 0


def test_rate_limiting(authenticated_websocket_client, scene):
    """Test WebSocket rate limiting."""
    # Join scene
    authenticated_websocket_client.emit("join_scene", {"scene_id": scene.id})
    authenticated_websocket_client.get_received()

    # Send many messages quickly
    for _ in range(100):
        authenticated_websocket_client.emit(
            "cursor_move", {"scene_id": scene.id, "position": {"x": 0, "y": 0}}
        )

    # Verify rate limit error
    received = authenticated_websocket_client.get_received()
    assert any(
        msg["name"] == "error" and "rate limit" in msg["args"][0]["message"].lower()
        for msg in received
    )


def test_scene_state_sync(authenticated_websocket_client, scene):
    """Test scene state synchronization."""
    # Join scene
    authenticated_websocket_client.emit("join_scene", {"scene_id": scene.id})
    received = authenticated_websocket_client.get_received()

    # Verify initial state was sent
    state_msg = next(msg for msg in received if msg["name"] == "scene_state")
    assert state_msg is not None
    assert "physics_objects" in state_msg["args"][0]
    assert "visual_effects" in state_msg["args"][0]
    assert "audio_tracks" in state_msg["args"][0]
