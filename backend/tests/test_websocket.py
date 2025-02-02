import pytest
from fastapi.testclient import TestClient
from fastapi import status, WebSocket
import json
import asyncio
from app.websocket import ConnectionManager
from app.core.config import settings

def test_websocket_connection(client: TestClient, token_headers: dict):
    """Test websocket connection."""
    with client.websocket_connect(
        f"{settings.API_V1_STR}/ws/universe/1",
        headers=token_headers
    ) as websocket:
        data = websocket.receive_json()
        assert "message" in data
        assert data["type"] == "connection_established"

def test_websocket_universe_updates(client: TestClient, token_headers: dict, test_universe):
    """Test universe updates through websocket."""
    with client.websocket_connect(
        f"{settings.API_V1_STR}/ws/universe/{test_universe.id}",
        headers=token_headers
    ) as websocket:
        # Initial connection message
        data = websocket.receive_json()
        assert data["type"] == "connection_established"

        # Send universe update
        websocket.send_json({
            "type": "universe_update",
            "data": {
                "physics_json": {"gravity": 9.81},
                "music_parameters": {"tempo": 120}
            }
        })

        # Receive update confirmation
        data = websocket.receive_json()
        assert data["type"] == "universe_updated"
        assert "physics_json" in data["data"]
        assert "music_parameters" in data["data"]

def test_websocket_unauthorized(client: TestClient):
    """Test unauthorized websocket connection."""
    with pytest.raises(Exception):
        with client.websocket_connect(f"{settings.API_V1_STR}/ws/universe/1"):
            pass

def test_websocket_invalid_universe(client: TestClient, token_headers: dict):
    """Test websocket connection to invalid universe."""
    with pytest.raises(Exception):
        with client.websocket_connect(
            f"{settings.API_V1_STR}/ws/universe/999",
            headers=token_headers
        ):
            pass

def test_audio_stream(client, auth_headers, test_audio):
    """Test audio streaming through WebSocket."""
    token = auth_headers["Authorization"].split()[1]
    with client.websocket_connect(f"/ws/audio/{test_audio.id}?token={token}") as websocket:
        # Initial connection message
        data = websocket.receive_json()
        assert data["type"] == "stream_start"
        assert "audio_id" in data

        # Receive audio chunks
        data = websocket.receive_bytes()
        assert len(data) > 0

def test_audio_stream_not_found(client, auth_headers):
    """Test streaming non-existent audio."""
    token = auth_headers["Authorization"].split()[1]
    with pytest.raises(Exception):
        with client.websocket_connect(f"/ws/audio/999?token={token}") as websocket:
            pass

def test_audio_stream_control(client, auth_headers, test_audio):
    """Test audio stream control commands."""
    token = auth_headers["Authorization"].split()[1]
    with client.websocket_connect(f"/ws/audio/{test_audio.id}?token={token}") as websocket:
        # Skip initial message
        websocket.receive_json()

        # Test pause
        websocket.send_json({"command": "pause"})
        response = websocket.receive_json()
        assert response["type"] == "stream_paused"

        # Test resume
        websocket.send_json({"command": "resume"})
        response = websocket.receive_json()
        assert response["type"] == "stream_resumed"

        # Test seek
        websocket.send_json({"command": "seek", "position": 30})
        response = websocket.receive_json()
        assert response["type"] == "stream_seeked"
        assert response["position"] == 30

def test_audio_stream_error_handling(client, auth_headers, test_audio):
    """Test error handling in audio streaming."""
    token = auth_headers["Authorization"].split()[1]
    with client.websocket_connect(f"/ws/audio/{test_audio.id}?token={token}") as websocket:
        # Skip initial message
        websocket.receive_json()

        # Test invalid command
        websocket.send_json({"command": "invalid"})
        response = websocket.receive_json()
        assert response["type"] == "error"
        assert "message" in response

def test_websocket_broadcast(client, auth_headers):
    """Test broadcasting messages to all connected clients."""
    token = auth_headers["Authorization"].split()[1]
    with client.websocket_connect(f"/ws?token={token}") as websocket1:
        websocket1.receive_json()  # Skip connection message

        with client.websocket_connect(f"/ws?token={token}") as websocket2:
            websocket2.receive_json()  # Skip connection message

            message = {"type": "broadcast", "content": "Test broadcast"}
            websocket1.send_json(message)

            response1 = websocket1.receive_json()
            response2 = websocket2.receive_json()

            assert response1["type"] == "broadcast"
            assert response1["content"] == message["content"]
            assert response2["type"] == "broadcast"
            assert response2["content"] == message["content"]

def test_websocket_room(client, auth_headers):
    """Test room-based messaging."""
    token = auth_headers["Authorization"].split()[1]
    room_id = "test_room"

    with client.websocket_connect(f"/ws?token={token}") as websocket1:
        websocket1.receive_json()  # Skip connection message
        websocket1.send_json({"type": "join_room", "room_id": room_id})

        with client.websocket_connect(f"/ws?token={token}") as websocket2:
            websocket2.receive_json()  # Skip connection message
            websocket2.send_json({"type": "join_room", "room_id": room_id})

            message = {
                "type": "room_message",
                "room_id": room_id,
                "content": "Test room message"
            }
            websocket1.send_json(message)

            response1 = websocket1.receive_json()
            response2 = websocket2.receive_json()

            assert response1["type"] == "room_message"
            assert response1["content"] == message["content"]
            assert response2["type"] == "room_message"
            assert response2["content"] == message["content"]

def test_websocket_heartbeat(client, auth_headers):
    """Test WebSocket heartbeat mechanism."""
    token = auth_headers["Authorization"].split()[1]
    with client.websocket_connect(f"/ws?token={token}") as websocket:
        websocket.receive_json()  # Skip connection message

        websocket.send_json({"type": "ping"})
        response = websocket.receive_json()
        assert response["type"] == "pong"

def test_websocket_reconnection(client, auth_headers):
    """Test WebSocket reconnection handling."""
    token = auth_headers["Authorization"].split()[1]
    with client.websocket_connect(f"/ws?token={token}") as websocket:
        websocket.receive_json()  # Skip connection message

        # Simulate disconnect
        websocket.send_json({"type": "disconnect"})
        response = websocket.receive_json()
        assert response["type"] == "disconnected"

    # Reconnect
    with client.websocket_connect(f"/ws?token={token}") as websocket:
        response = websocket.receive_json()
        assert response["type"] == "connection_established"
        assert "reconnected" in response

def test_websocket_large_message(client, auth_headers):
    """Test handling of large WebSocket messages."""
    token = auth_headers["Authorization"].split()[1]
    with client.websocket_connect(f"/ws?token={token}") as websocket:
        websocket.receive_json()  # Skip connection message

        # Send large message
        large_content = "x" * 1024 * 1024  # 1MB message
        message = {"type": "message", "content": large_content}
        websocket.send_json(message)

        response = websocket.receive_json()
        assert response["type"] == "error"
        assert "message size" in response["message"].lower()

def test_websocket_concurrent_connections(client, auth_headers):
    """Test handling multiple concurrent WebSocket connections."""
    token = auth_headers["Authorization"].split()[1]
    max_connections = 5
    connections = []

    try:
        for _ in range(max_connections):
            websocket = client.websocket_connect(f"/ws?token={token}")
            connections.append(websocket.__enter__())
            response = connections[-1].receive_json()
            assert response["type"] == "connection_established"

        # Try one more connection
        with pytest.raises(Exception):
            with client.websocket_connect(f"/ws?token={token}") as websocket:
                pass

    finally:
        for conn in connections:
            conn.__exit__(None, None, None)

def test_websocket_message(client, auth_headers):
    """Test sending and receiving messages through WebSocket."""
    token = auth_headers["Authorization"].split()[1]
    with client.websocket_connect(f"/ws?token={token}") as websocket:
        # Skip connection message
        websocket.receive_json()

        # Send a message
        message = {
            "type": "chat",
            "content": "Hello, World!"
        }
        websocket.send_json(message)

        # Receive echo
        response = websocket.receive_json()
        assert response["type"] == "chat"
        assert response["content"] == message["content"]

def test_websocket_metrics(client, auth_headers):
    """Test WebSocket metrics collection."""
    token = auth_headers["Authorization"].split()[1]
    with client.websocket_connect(f"/ws?token={token}") as websocket:
        # Skip connection message
        websocket.receive_json()

        # Send multiple messages to generate metrics
        for _ in range(5):
            message = {
                "type": "chat",
                "content": "Test message"
            }
            websocket.send_json(message)
            websocket.receive_json()  # Get echo

        # Request metrics
        websocket.send_json({"type": "get_metrics"})
        metrics = websocket.receive_json()

        assert metrics["type"] == "metrics"
        assert "message_count" in metrics
        assert "latency" in metrics
        assert "error_count" in metrics

def test_websocket_error_handling(client, auth_headers):
    """Test WebSocket error handling."""
    token = auth_headers["Authorization"].split()[1]
    with client.websocket_connect(f"/ws?token={token}") as websocket:
        # Skip connection message
        websocket.receive_json()

        # Send invalid message
        websocket.send_json({"type": "invalid_type"})

        # Should receive error response
        response = websocket.receive_json()
        assert response["type"] == "error"
        assert "message" in response

def test_websocket_disconnect(client, auth_headers):
    """Test WebSocket disconnection handling."""
    token = auth_headers["Authorization"].split()[1]
    with client.websocket_connect(f"/ws?token={token}") as websocket:
        # Skip connection message
        websocket.receive_json()

        # Send disconnect message
        websocket.send_json({"type": "disconnect"})

        # Should receive disconnect confirmation
        response = websocket.receive_json()
        assert response["type"] == "disconnected"
