import pytest
from flask_socketio import SocketIOTestClient
from app import create_app
from app.extensions import socketio

@pytest.fixture
def app():
    app = create_app('testing')
    return app

@pytest.fixture
def socket_client(app):
    client = SocketIOTestClient(app, socketio)
    return client

class TestWebSocket:
    def test_connect(self, socket_client):
        """Test WebSocket connection."""
        assert socket_client.is_connected()

    def test_join_universe(self, socket_client, auth_headers):
        """Test joining a universe room."""
        socket_client.emit('join', {'universe_id': 1, 'token': auth_headers['Authorization']})
        received = socket_client.get_received()
        assert len(received) > 0
        assert received[0]['name'] == 'joined'
        assert received[0]['args'][0]['universe_id'] == 1

    def test_leave_universe(self, socket_client, auth_headers):
        """Test leaving a universe room."""
        socket_client.emit('join', {'universe_id': 1, 'token': auth_headers['Authorization']})
        socket_client.emit('leave', {'universe_id': 1})
        received = socket_client.get_received()
        assert any(msg['name'] == 'left' for msg in received)

    def test_parameter_update(self, socket_client, auth_headers):
        """Test parameter update broadcasting."""
        socket_client.emit('join', {'universe_id': 1, 'token': auth_headers['Authorization']})
        socket_client.emit('parameter_update', {
            'universe_id': 1,
            'type': 'physics',
            'parameters': {'gravity': 10.0}
        })
        received = socket_client.get_received()
        assert any(
            msg['name'] == 'parameter_updated' and
            msg['args'][0]['parameters']['gravity'] == 10.0
            for msg in received
        )

    def test_presence_update(self, socket_client, auth_headers):
        """Test presence update broadcasting."""
        socket_client.emit('join', {'universe_id': 1, 'token': auth_headers['Authorization']})
        received = socket_client.get_received()
        assert any(
            msg['name'] == 'presence_update' and
            isinstance(msg['args'][0]['active_users'], list)
            for msg in received
        )

    def test_invalid_token(self, socket_client):
        """Test connection with invalid token."""
        socket_client.emit('join', {
            'universe_id': 1,
            'token': 'invalid-token'
        })
        received = socket_client.get_received()
        assert any(
            msg['name'] == 'error' and
            'authentication' in msg['args'][0]['message'].lower()
            for msg in received
        )

    def test_unauthorized_universe(self, socket_client, auth_headers):
        """Test joining unauthorized universe."""
        socket_client.emit('join', {
            'universe_id': 999,
            'token': auth_headers['Authorization']
        })
        received = socket_client.get_received()
        assert any(
            msg['name'] == 'error' and
            'unauthorized' in msg['args'][0]['message'].lower()
            for msg in received
        )
