import pytest
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocket
from unittest.mock import AsyncMock, patch, Mock
from app import create_app
from app.websocket import socketio
from app.models.audio_file import AudioFile
from app.core.config import settings
from app.schemas.user import User as UserSchema

@pytest.mark.asyncio
async def test_websocket_connection(socketio_client):
    """Test establishing WebSocket connection."""
    socketio_client.connect()
    assert socketio_client.is_connected()
    socketio_client.disconnect()

@pytest.mark.asyncio
async def test_audio_stream(socketio_client, test_audio):
    """Test streaming audio data over WebSocket."""
    socketio_client.connect()

    # Emit join room event
    socketio_client.emit('join', {'room': str(test_audio.id)})
    received = socketio_client.get_received()
    assert len(received) > 0
    assert received[0]['name'] == 'joined'

    # Emit start stream event
    socketio_client.emit('start_stream', {'audio_id': str(test_audio.id)})
    received = socketio_client.get_received()
    assert len(received) > 0
    assert received[0]['name'] == 'stream_started'

    socketio_client.disconnect()

@pytest.mark.asyncio
async def test_audio_stream_not_found(socketio_client):
    """Test attempting to stream non-existent audio."""
    socketio_client.connect()

    # Try to join non-existent room
    socketio_client.emit('join', {'room': '999999'})
    received = socketio_client.get_received()
    assert len(received) > 0
    assert received[0]['name'] == 'error'
    assert 'Audio not found' in received[0]['args'][0]['message']

    socketio_client.disconnect()

@pytest.mark.asyncio
async def test_audio_stream_control(socketio_client, test_audio):
    """Test audio stream control commands."""
    socketio_client.connect()

    # Join audio room
    socketio_client.emit('join', {'room': str(test_audio.id)})

    # Test play command
    socketio_client.emit('control', {
        'command': 'play',
        'audio_id': str(test_audio.id)
    })
    received = socketio_client.get_received()
    assert received[-1]['name'] == 'status'
    assert received[-1]['args'][0]['status'] == 'playing'

    # Test pause command
    socketio_client.emit('control', {
        'command': 'pause',
        'audio_id': str(test_audio.id)
    })
    received = socketio_client.get_received()
    assert received[-1]['name'] == 'status'
    assert received[-1]['args'][0]['status'] == 'paused'

    # Test seek command
    socketio_client.emit('control', {
        'command': 'seek',
        'audio_id': str(test_audio.id),
        'position': 60
    })
    received = socketio_client.get_received()
    assert received[-1]['name'] == 'status'
    assert received[-1]['args'][0]['status'] == 'seeked'
    assert received[-1]['args'][0]['position'] == 60

    socketio_client.disconnect()

@patch('app.services.media_service.process_audio')
def test_audio_stream_error_handling(mock_process, socketio_client, test_audio):
    """Test error handling in audio streaming."""
    mock_process.side_effect = Exception("Processing error")

    socketio_client.connect()
    socketio_client.emit('start_stream', {'audio_id': str(test_audio.id)})

    received = socketio_client.get_received()
    assert received[-1]['name'] == 'error'
    assert 'Processing error' in received[-1]['args'][0]['message']

    socketio_client.disconnect()

@pytest.mark.asyncio
async def test_websocket_authentication(socketio_client, test_user, auth_headers):
    """Test WebSocket authentication."""
    # Without authentication
    socketio_client.connect()
    socketio_client.emit('join_protected')
    received = socketio_client.get_received()
    assert received[-1]['name'] == 'error'
    assert 'Unauthorized' in received[-1]['args'][0]['message']
    socketio_client.disconnect()

    # With authentication
    token = auth_headers['Authorization'].split()[1]
    socketio_client.connect(headers={'Authorization': f'Bearer {token}'})
    socketio_client.emit('join_protected')
    received = socketio_client.get_received()
    assert received[-1]['name'] == 'joined'
    assert 'Authenticated' in received[-1]['args'][0]['message']
    socketio_client.disconnect()

@pytest.mark.asyncio
async def test_websocket_broadcast(socketio_client):
    """Test broadcasting messages to all connected clients."""
    # Create two clients
    client1 = socketio_client
    client2 = socketio.test_client(create_app())

    client1.connect()
    client2.connect()

    # Join broadcast room
    client1.emit('join', {'room': 'broadcast'})
    client2.emit('join', {'room': 'broadcast'})

    # Send broadcast message
    client1.emit('broadcast', {'message': 'Hello everyone!'})

    # Check both clients received the message
    received1 = client1.get_received()
    received2 = client2.get_received()

    assert received1[-1]['name'] == 'message'
    assert received2[-1]['name'] == 'message'
    assert received1[-1]['args'][0]['message'] == 'Hello everyone!'
    assert received2[-1]['args'][0]['message'] == 'Hello everyone!'

    client1.disconnect()
    client2.disconnect()

@pytest.mark.asyncio
async def test_websocket_room(socketio_client):
    """Test room-based WebSocket communication."""
    # Create three clients
    client1 = socketio_client
    client2 = socketio.test_client(create_app())
    client3 = socketio.test_client(create_app())

    client1.connect()
    client2.connect()
    client3.connect()

    # Join rooms
    client1.emit('join', {'room': 'room1'})
    client2.emit('join', {'room': 'room1'})
    client3.emit('join', {'room': 'room2'})

    # Send message to room1
    client1.emit('room_message', {
        'room': 'room1',
        'message': 'Message for room1'
    })

    # Check messages
    received1 = client1.get_received()
    received2 = client2.get_received()
    received3 = client3.get_received()

    assert received1[-1]['name'] == 'message'
    assert received2[-1]['name'] == 'message'
    assert received1[-1]['args'][0]['message'] == 'Message for room1'
    assert received2[-1]['args'][0]['message'] == 'Message for room1'

    # Client3 should not have received the message
    assert not any(r['name'] == 'message' for r in received3)

    client1.disconnect()
    client2.disconnect()
    client3.disconnect()

@pytest.mark.asyncio
async def test_websocket_heartbeat(socketio_client):
    """Test WebSocket connection heartbeat."""
    socketio_client.connect()

    socketio_client.emit('ping')
    received = socketio_client.get_received()
    assert received[-1]['name'] == 'pong'

    socketio_client.disconnect()

@pytest.mark.asyncio
async def test_websocket_reconnection(socketio_client):
    """Test WebSocket reconnection handling."""
    # First connection
    socketio_client.connect()
    socketio_client.emit('identify', {'client_id': '123'})
    received = socketio_client.get_received()
    assert received[-1]['name'] == 'connected'
    socketio_client.disconnect()

    # Reconnection
    socketio_client.connect()
    socketio_client.emit('identify', {'client_id': '123'})
    received = socketio_client.get_received()
    assert received[-1]['name'] == 'reconnected'
    socketio_client.disconnect()

@pytest.mark.asyncio
async def test_websocket_large_message(socketio_client):
    """Test handling large messages over WebSocket."""
    socketio_client.connect()

    # Generate large message
    large_message = "x" * (1024 * 1024)  # 1MB message

    # Send large message in chunks
    chunk_size = 1024
    for i in range(0, len(large_message), chunk_size):
        chunk = large_message[i:i + chunk_size]
        socketio_client.emit('large_message', {'chunk': chunk})

    received = socketio_client.get_received()
    assert received[-1]['name'] == 'message_received'
    assert "Received 1MB" in received[-1]['args'][0]['message']

    socketio_client.disconnect()

@pytest.mark.asyncio
async def test_websocket_concurrent_connections():
    """Test handling multiple concurrent WebSocket connections."""
    max_connections = 10
    clients = []

    # Establish multiple connections
    for i in range(max_connections):
        client = socketio.test_client(create_app())
        client.connect()
        clients.append(client)

    # Verify all connections are active
    for client in clients:
        assert client.is_connected()

    # Test broadcasting to all clients
    clients[0].emit('broadcast', {'message': 'Hello all!'})

    # Verify all clients received the message
    for client in clients:
        received = client.get_received()
        assert received[-1]['name'] == 'message'
        assert received[-1]['args'][0]['message'] == 'Hello all!'

    # Cleanup
    for client in clients:
        client.disconnect()
