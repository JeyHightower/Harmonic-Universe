import pytest
from flask_socketio import SocketIO
from app.models import Universe, Scene, User
from ..factories import UniverseFactory, UserFactory

def test_scene_collaboration(app, socketio_client, test_user, test_scene):
    """Test real-time collaboration in scene editing"""

    # Create another user and client
    other_user = UserFactory()
    other_client = socketio_client

    # Both users join the scene room
    socketio_client.emit('join', {'scene_id': test_scene.id})
    other_client.emit('join', {'scene_id': test_scene.id})

    # First user updates object position
    update_data = {
        'scene_id': test_scene.id,
        'object_id': 1,
        'position': {'x': 100, 'y': 100}
    }
    socketio_client.emit('update_object', update_data)

    # Verify other user receives update
    received = other_client.get_received()
    assert len(received) > 0
    assert received[0]['name'] == 'object_updated'
    assert received[0]['args'][0]['position'] == {'x': 100, 'y': 100}

def test_cursor_sharing(app, socketio_client, test_user, test_scene):
    """Test sharing cursor positions between users"""

    other_user = UserFactory()
    other_client = socketio_client

    # Join scene room
    socketio_client.emit('join', {'scene_id': test_scene.id})
    other_client.emit('join', {'scene_id': test_scene.id})

    # Update cursor position
    cursor_data = {
        'scene_id': test_scene.id,
        'user_id': test_user.id,
        'position': {'x': 150, 'y': 150}
    }
    socketio_client.emit('cursor_move', cursor_data)

    # Verify other user receives cursor update
    received = other_client.get_received()
    assert len(received) > 0
    assert received[0]['name'] == 'cursor_moved'
    assert received[0]['args'][0]['position'] == {'x': 150, 'y': 150}

def test_chat_messages(app, socketio_client, test_user, test_scene):
    """Test real-time chat messages"""

    other_user = UserFactory()
    other_client = socketio_client

    # Join scene room
    socketio_client.emit('join', {'scene_id': test_scene.id})
    other_client.emit('join', {'scene_id': test_scene.id})

    # Send chat message
    message_data = {
        'scene_id': test_scene.id,
        'user_id': test_user.id,
        'message': 'Hello, collaborators!'
    }
    socketio_client.emit('chat_message', message_data)

    # Verify other user receives message
    received = other_client.get_received()
    assert len(received) > 0
    assert received[0]['name'] == 'chat_message_received'
    assert received[0]['args'][0]['message'] == 'Hello, collaborators!'

def test_presence_tracking(app, socketio_client, test_user, test_scene):
    """Test user presence tracking"""

    # Join scene
    join_data = {
        'scene_id': test_scene.id,
        'user_id': test_user.id
    }
    socketio_client.emit('join', join_data)

    # Verify presence list
    received = socketio_client.get_received()
    assert len(received) > 0
    assert received[0]['name'] == 'presence_update'
    assert test_user.id in [u['id'] for u in received[0]['args'][0]['users']]

    # Disconnect
    socketio_client.disconnect()

    # Verify user removed from presence list
    received = socketio_client.get_received()
    assert len(received) > 0
    assert received[0]['name'] == 'presence_update'
    assert test_user.id not in [u['id'] for u in received[0]['args'][0]['users']]
