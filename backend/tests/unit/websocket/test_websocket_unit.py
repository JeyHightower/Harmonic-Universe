"""Test WebSocket functionality."""
import pytest
from flask import Flask
from flask_socketio import SocketIO
from datetime import datetime, timedelta
from app.websocket import WebSocketService
from app.models.base import User, Universe, PhysicsParameters, MusicParameters, VisualizationParameters
from app.extensions import db
from unittest.mock import Mock, patch
from ...config import TestConfig

@pytest.fixture
def app():
    """Create a Flask application."""
    app = Flask(__name__)
    app.config.from_object(TestConfig)
    db.init_app(app)

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def socketio(app):
    """Create a SocketIO instance."""
    return SocketIO(app, async_mode='threading', message_queue=None)

@pytest.fixture
def websocket_service(app, socketio):
    """Create a WebSocket service instance."""
    service = WebSocketService(socketio)
    service.register_handlers()
    return service

@pytest.fixture
def test_user(app):
    """Create a test user."""
    with app.app_context():
        user = User(username='testuser', email='test@example.com')
        user.set_password('password123')
        db.session.add(user)
        db.session.commit()
        return user

def test_create_collaboration_room(websocket_service, test_user):
    """Test creating a collaboration room."""
    room = websocket_service.create_room(test_user.id, 'test-universe')
    assert room is not None
    assert test_user.id in websocket_service.get_room_participants('test-universe')

def test_connection_limit(websocket_service):
    """Test connection limit enforcement."""
    # Create max number of connections
    max_connections = 10
    for i in range(max_connections):
        websocket_service.create_room(i, f'universe-{i}')

    # Try to create one more
    with pytest.raises(Exception):
        websocket_service.create_room(max_connections + 1, 'universe-overflow')

def test_error_handling(websocket_service):
    """Test error handling in WebSocket service."""
    # Test invalid room
    with pytest.raises(Exception):
        websocket_service.join_room(None, 'invalid-room')

    # Test invalid user
    with pytest.raises(Exception):
        websocket_service.join_room('invalid-user', 'test-room')
