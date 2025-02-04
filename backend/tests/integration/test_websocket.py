import pytest
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocket
from unittest.mock import AsyncMock, patch, Mock
from app.main import app
from app.models.audio_file import AudioFile
from app.core.config import settings
from app.schemas.user import User as UserSchema

# Create test client
client = TestClient(app)

@pytest.mark.asyncio
async def test_websocket_connection(test_client):
    """Test establishing WebSocket connection."""
    with test_client.websocket_connect("/ws") as websocket:
        assert websocket.can_receive()

@pytest.mark.asyncio
async def test_audio_stream(test_client, test_audio, auth_headers):
    """Test streaming audio data over WebSocket."""
    with test_client.websocket_connect(f"/ws/audio/{test_audio.id}", headers=auth_headers) as websocket:
        # Send join room message
        await websocket.send_json({"event": "join_room", "room": str(test_audio.id)})
        data = await websocket.receive_json()
        assert data["event"] == "joined"

        # Send start stream message
        await websocket.send_json({"event": "start_stream", "audio_id": str(test_audio.id)})
        data = await websocket.receive_json()
        assert data["event"] == "stream_started"

@pytest.mark.asyncio
async def test_audio_stream_not_found(test_client, auth_headers):
    """Test attempting to stream non-existent audio."""
    with test_client.websocket_connect("/ws/audio/999999", headers=auth_headers) as websocket:
        # Try to join non-existent room
        await websocket.send_json({"event": "join_room", "room": "999999"})
        data = await websocket.receive_json()
        assert data["event"] == "error"
        assert "Audio not found" in data["message"]

@pytest.mark.asyncio
async def test_audio_stream_control(test_client, test_audio, auth_headers):
    """Test audio stream control commands."""
    with test_client.websocket_connect(f"/ws/audio/{test_audio.id}", headers=auth_headers) as websocket:
        # Join audio room
        await websocket.send_json({"event": "join_room", "room": str(test_audio.id)})
        await websocket.receive_json()  # Receive join confirmation

        # Test play command
        await websocket.send_json({
            "event": "control",
            "command": "play",
            "audio_id": str(test_audio.id)
        })
        data = await websocket.receive_json()
        assert data["event"] == "status"
        assert data["status"] == "playing"

        # Test pause command
        await websocket.send_json({
            "event": "control",
            "command": "pause",
            "audio_id": str(test_audio.id)
        })
        data = await websocket.receive_json()
        assert data["event"] == "status"
        assert data["status"] == "paused"

        # Test seek command
        await websocket.send_json({
            "event": "control",
            "command": "seek",
            "audio_id": str(test_audio.id),
            "position": 60
        })
        data = await websocket.receive_json()
        assert data["event"] == "status"
        assert data["status"] == "seeked"
        assert data["position"] == 60

@patch('app.services.media_service.process_audio')
async def test_audio_stream_error_handling(mock_process, test_client, test_audio, auth_headers):
    """Test error handling in audio streaming."""
    mock_process.side_effect = Exception("Processing error")

    with test_client.websocket_connect(f"/ws/audio/{test_audio.id}", headers=auth_headers) as websocket:
        await websocket.send_json({"event": "start_stream", "audio_id": str(test_audio.id)})
        data = await websocket.receive_json()
        assert data["event"] == "error"
        assert "Processing error" in data["message"]

@pytest.mark.asyncio
async def test_websocket_authentication(test_client):
    """Test WebSocket authentication."""
    # Without authentication
    with pytest.raises(Exception):
        with test_client.websocket_connect("/ws/protected") as websocket:
            pass

    # With authentication
    with test_client.websocket_connect("/ws/protected", headers=auth_headers) as websocket:
        await websocket.send_json({"event": "join_protected"})
        data = await websocket.receive_json()
        assert data["event"] == "joined"
        assert "Authenticated" in data["message"]

@pytest.mark.asyncio
async def test_websocket_broadcast(test_client, auth_headers):
    """Test broadcasting messages to all connected clients."""
    async with test_client.websocket_connect("/ws/broadcast", headers=auth_headers) as client1, \
              test_client.websocket_connect("/ws/broadcast", headers=auth_headers) as client2:

        # Join broadcast room
        await client1.send_json({"event": "join_room", "room": "broadcast"})
        await client2.send_json({"event": "join_room", "room": "broadcast"})

        # Wait for join confirmations
        await client1.receive_json()
        await client2.receive_json()

        # Send broadcast message
        await client1.send_json({"event": "broadcast", "message": "Hello everyone!"})

        # Check both clients received the message
        data1 = await client1.receive_json()
        data2 = await client2.receive_json()

        assert data1["event"] == "message"
        assert data2["event"] == "message"
        assert data1["message"] == "Hello everyone!"
        assert data2["message"] == "Hello everyone!"

@pytest.mark.asyncio
async def test_websocket_room(test_client, auth_headers):
    """Test room-based WebSocket communication."""
    async with test_client.websocket_connect("/ws/room", headers=auth_headers) as client1, \
              test_client.websocket_connect("/ws/room", headers=auth_headers) as client2, \
              test_client.websocket_connect("/ws/room", headers=auth_headers) as client3:

        # Join rooms
        await client1.send_json({"event": "join_room", "room": "room1"})
        await client2.send_json({"event": "join_room", "room": "room1"})
        await client3.send_json({"event": "join_room", "room": "room2"})

        # Wait for join confirmations
        await client1.receive_json()
        await client2.receive_json()
        await client3.receive_json()

        # Send message to room1
        await client1.send_json({
            "event": "room_message",
            "room": "room1",
            "message": "Message for room1"
        })

        # Check messages
        data1 = await client1.receive_json()
        data2 = await client2.receive_json()

        assert data1["event"] == "message"
        assert data2["event"] == "message"
        assert data1["message"] == "Message for room1"
        assert data2["message"] == "Message for room1"

        # Client3 should not receive the message (will raise TimeoutError)
        with pytest.raises(TimeoutError):
            await client3.receive_json(timeout=1.0)

@pytest.mark.asyncio
async def test_websocket_heartbeat(test_client, auth_headers):
    """Test WebSocket connection heartbeat."""
    with test_client.websocket_connect("/ws", headers=auth_headers) as websocket:
        await websocket.send_json({"event": "ping"})
        data = await websocket.receive_json()
        assert data["event"] == "pong"

@pytest.mark.asyncio
async def test_websocket_reconnection(test_client, auth_headers):
    """Test WebSocket reconnection handling."""
    # First connection
    with test_client.websocket_connect("/ws", headers=auth_headers) as websocket:
        await websocket.send_json({"event": "identify", "client_id": "123"})
        data = await websocket.receive_json()
        assert data["event"] == "connected"

    # Reconnection
    with test_client.websocket_connect("/ws", headers=auth_headers) as websocket:
        await websocket.send_json({"event": "identify", "client_id": "123"})
        data = await websocket.receive_json()
        assert data["event"] == "reconnected"

@pytest.mark.asyncio
async def test_websocket_large_message(test_client, auth_headers):
    """Test handling large messages over WebSocket."""
    with test_client.websocket_connect("/ws", headers=auth_headers) as websocket:
        # Generate large message
        large_message = "x" * (1024 * 1024)  # 1MB message

        # Send large message in chunks
        chunk_size = 1024
        for i in range(0, len(large_message), chunk_size):
            chunk = large_message[i:i + chunk_size]
            await websocket.send_json({"event": "large_message", "chunk": chunk})

        data = await websocket.receive_json()
        assert data["event"] == "message_received"
        assert "Received 1MB" in data["message"]

@pytest.mark.asyncio
async def test_websocket_concurrent_connections(test_client, auth_headers):
    """Test handling multiple concurrent WebSocket connections."""
    max_connections = 10
    websockets = []

    try:
        # Establish multiple connections
        for i in range(max_connections):
            ws = await test_client.websocket_connect("/ws", headers=auth_headers)
            websockets.append(ws)

        # Verify all connections are active
        for ws in websockets:
            await ws.send_json({"event": "ping"})
            data = await ws.receive_json()
            assert data["event"] == "pong"

    finally:
        # Clean up connections
        for ws in websockets:
            await ws.close()
