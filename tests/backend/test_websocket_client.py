import pytest
import asyncio
import json
from flask_socketio import SocketIO, SocketIOTestClient
from app import create_app, db, socketio
from app.models.user import User
from app.models.universe import Universe
from flask_jwt_extended import create_access_token
import time

class TestWebSocketClient:
    @pytest.fixture(autouse=True)
    def setup(self, app, test_user):
        """Setup test environment"""
        self.app = app
        self.test_user = test_user
        self.access_token = create_access_token(identity=test_user.id)

        with app.app_context():
            # Create test universe
            self.universe = Universe(
                name="Test Universe",
                creator_id=test_user.id,
                is_public=True
            )
            db.session.add(self.universe)
            db.session.commit()

            # Create test client
            self.client = SocketIOTestClient(
                app,
                socketio,
                namespace='/test',
                query_string=f'token={self.access_token}'
            )

            yield

            # Cleanup
            self.client.disconnect(namespace='/test')

    def test_connection_lifecycle(self):
        """Test WebSocket connection lifecycle"""
        with self.app.app_context():
            # Test initial connection
            assert self.client.is_connected(namespace='/test')

            # Test disconnection
            self.client.disconnect(namespace='/test')
            assert not self.client.is_connected(namespace='/test')

            # Test reconnection
            self.client.connect(namespace='/test')
            assert self.client.is_connected(namespace='/test')

    def test_universe_interaction(self):
        """Test universe-related WebSocket interactions"""
        with self.app.app_context():
            # Join universe
            self.client.emit('join', {'universe_id': self.universe.id}, namespace='/test')
            received = self.client.get_received(namespace='/test')
            assert any(
                event.get('name') == 'join_confirmed' and
                event.get('args')[0].get('universe_id') == self.universe.id
                for event in received
            )

            # Update parameters
            params = {'physics': {'gravity': 9.81}}
            self.client.emit('parameter_update', {
                'universe_id': self.universe.id,
                'parameters': params
            }, namespace='/test')
            received = self.client.get_received(namespace='/test')
            assert any(event.get('name') == 'parameter_update_confirmed' for event in received)

            # Leave universe
            self.client.emit('leave', {'universe_id': self.universe.id}, namespace='/test')
            received = self.client.get_received(namespace='/test')
            assert any(
                event.get('name') == 'leave_confirmed' and
                event.get('args')[0].get('universe_id') == self.universe.id
                for event in received
            )

    def test_chat_functionality(self):
        """Test chat functionality"""
        with self.app.app_context():
            # Join universe first
            self.client.emit('join', {'universe_id': self.universe.id}, namespace='/test')
            self.client.get_received(namespace='/test')  # Clear events

            # Send chat message
            message = "Hello, Universe!"
            self.client.emit('chat_message', {
                'universe_id': self.universe.id,
                'message': message,
                'type': 'chat'
            }, namespace='/test')

            received = self.client.get_received(namespace='/test')
            assert any(
                event.get('name') == 'chat_message' and
                event.get('args')[0].get('message') == message
                for event in received
            )

    def test_simulation_control(self):
        """Test simulation control"""
        with self.app.app_context():
            # Join universe first
            self.client.emit('join', {'universe_id': self.universe.id}, namespace='/test')
            self.client.get_received(namespace='/test')  # Clear events

            # Start simulation
            self.client.emit('start_simulation', {
                'universe_id': self.universe.id
            }, namespace='/test')
            received = self.client.get_received(namespace='/test')
            assert any(event.get('name') == 'simulation_started' for event in received)

            # Stop simulation
            self.client.emit('stop_simulation', {
                'universe_id': self.universe.id
            }, namespace='/test')
            received = self.client.get_received(namespace='/test')
            assert any(event.get('name') == 'simulation_stopped' for event in received)

    def test_error_handling(self):
        """Test error handling in WebSocket communication"""
        with self.app.app_context():
            # Test joining non-existent universe
            self.client.emit('join', {'universe_id': 999}, namespace='/test')
            received = self.client.get_received(namespace='/test')
            assert any(
                event.get('name') == 'error' and
                'Universe not found' in str(event.get('args', [{}])[0].get('error', ''))
                for event in received
            )

            # Test invalid message format
            self.client.emit('chat_message', {'invalid': 'format'}, namespace='/test')
            received = self.client.get_received(namespace='/test')
            assert any(event.get('name') == 'error' for event in received)

    def test_concurrent_connections(self):
        """Test handling of concurrent connections"""
        with self.app.app_context():
            # Create another client with same user
            client2 = SocketIOTestClient(
                self.app,
                socketio,
                namespace='/test',
                query_string=f'token={self.access_token}'
            )

            # Both clients should be connected
            assert self.client.is_connected(namespace='/test')
            assert client2.is_connected(namespace='/test')

            # Join universe with both clients
            self.client.emit('join', {'universe_id': self.universe.id}, namespace='/test')
            client2.emit('join', {'universe_id': self.universe.id}, namespace='/test')

            # Both should receive join confirmation
            assert any(
                event.get('name') == 'join_confirmed'
                for event in self.client.get_received(namespace='/test')
            )
            assert any(
                event.get('name') == 'join_confirmed'
                for event in client2.get_received(namespace='/test')
            )

            # Cleanup
            client2.disconnect(namespace='/test')
