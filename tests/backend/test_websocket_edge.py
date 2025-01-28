import pytest
from datetime import datetime
import json
from flask_socketio import SocketIOTestClient
from app import create_app, db, socketio
from app.models.user import User
from app.models.universe import Universe
from flask_jwt_extended import create_access_token
import time

class TestWebSocketEdgeCases:
    """Test websocket edge cases and error handling"""

    def test_connection_handling(self, app):
        """Test various connection scenarios"""
        with app.app_context():
            # Test invalid token
            client = SocketIOTestClient(
                app,
                socketio,
                namespace='/test',
                query_string='token=invalid'
            )
            client.connect(namespace='/test')
            time.sleep(0.1)  # Wait for connection attempt
            assert not client.is_connected(namespace='/test')

            # Test missing token
            client = SocketIOTestClient(
                app,
                socketio,
                namespace='/test'
            )
            client.connect(namespace='/test')
            time.sleep(0.1)  # Wait for connection attempt
            assert not client.is_connected(namespace='/test')

            # Test expired token
            expired_token = create_access_token(identity=1, expires_delta=False)
            client = SocketIOTestClient(
                app,
                socketio,
                namespace='/test',
                query_string=f'token={expired_token}'
            )
            client.connect(namespace='/test')
            time.sleep(0.1)  # Wait for connection attempt
            assert not client.is_connected(namespace='/test')

    def test_universe_access_control(self, app):
        """Test universe access control edge cases"""
        with app.app_context():
            # Create test users
            owner = User(username='owner', email='owner@example.com')
            owner.set_password('password123')
            db.session.add(owner)

            other_user = User(username='other', email='other@example.com')
            other_user.set_password('password123')
            db.session.add(other_user)

            db.session.commit()

            # Create private universe
            private_universe = Universe(
                name="Private Universe",
                description="Private",
                creator_id=owner.id,
                is_public=False
            )
            db.session.add(private_universe)
            db.session.commit()

            # Create client for other user
            other_token = create_access_token(identity=other_user.id)
            client = SocketIOTestClient(
                app,
                socketio,
                namespace='/test',
                query_string=f'token={other_token}'
            )

            # Connect and try to join
            client.connect(namespace='/test')
            time.sleep(0.1)  # Wait for connection

            # Try joining non-existent universe
            client.emit('join', {'universe_id': 99999}, namespace='/test')
            received = client.get_received(namespace='/test')
            assert any(
                event.get('name') == 'error' and
                'universe not found' in str(event.get('args', [{}])[0]).lower()
                for event in received
            )

            # Try joining private universe
            client.emit('join', {'universe_id': private_universe.id}, namespace='/test')
            received = client.get_received(namespace='/test')
            assert any(
                event.get('name') == 'error' and
                'unauthorized' in str(event.get('args', [{}])[0]).lower()
                for event in received
            )

            # Clean up
            client.disconnect(namespace='/test')
            db.session.delete(private_universe)
            db.session.delete(owner)
            db.session.delete(other_user)
            db.session.commit()

    def test_concurrent_operations(self, app):
        """Test handling of concurrent operations"""
        with app.app_context():
            # Create test users
            user1 = User(username='user1', email='user1@example.com')
            user1.set_password('password123')
            db.session.add(user1)

            user2 = User(username='user2', email='user2@example.com')
            user2.set_password('password123')
            db.session.add(user2)

            db.session.commit()

            # Create shared universe
            universe = Universe(
                name="Shared Universe",
                description="Shared",
                creator_id=user1.id,
                is_public=True
            )
            db.session.add(universe)
            db.session.commit()

            # Create clients
            token1 = create_access_token(identity=user1.id)
            client1 = SocketIOTestClient(
                app,
                socketio,
                namespace='/test',
                query_string=f'token={token1}'
            )

            token2 = create_access_token(identity=user2.id)
            client2 = SocketIOTestClient(
                app,
                socketio,
                namespace='/test',
                query_string=f'token={token2}'
            )

            # Connect and join
            client1.connect(namespace='/test')
            client2.connect(namespace='/test')
            time.sleep(0.1)  # Wait for connections

            client1.emit('join', {'universe_id': universe.id}, namespace='/test')
            client2.emit('join', {'universe_id': universe.id}, namespace='/test')
            time.sleep(0.1)  # Wait for joins

            # Clear received messages
            client1.get_received(namespace='/test')
            client2.get_received(namespace='/test')

            # Test concurrent parameter updates
            update_data1 = {
                'universe_id': universe.id,
                'parameters': {'physics': {'gravity': 5.0}}
            }
            update_data2 = {
                'universe_id': universe.id,
                'parameters': {'physics': {'gravity': 7.0}}
            }

            client1.emit('parameter_update', update_data1, namespace='/test')
            client2.emit('parameter_update', update_data2, namespace='/test')

            # Both clients should receive both updates in order
            time.sleep(0.1)  # Wait for updates
            received1 = client1.get_received(namespace='/test')
            received2 = client2.get_received(namespace='/test')

            assert len(received1) == len(received2)
            assert all(
                event1.get('args') == event2.get('args')
                for event1, event2 in zip(received1, received2)
            )

            # Clean up
            client1.disconnect(namespace='/test')
            client2.disconnect(namespace='/test')
            db.session.delete(universe)
            db.session.delete(user1)
            db.session.delete(user2)
            db.session.commit()

    def test_reconnection_handling(self, app):
        """Test reconnection scenarios"""
        with app.app_context():
            # Create test user
            user = User(username='testuser', email='test@example.com')
            user.set_password('password123')
            db.session.add(user)
            db.session.commit()

            # Create universe
            universe = Universe(
                name="Test Universe",
                description="Test",
                creator_id=user.id,
                is_public=True
            )
            db.session.add(universe)
            db.session.commit()

            # Create client
            token = create_access_token(identity=user.id)
            client = SocketIOTestClient(
                app,
                socketio,
                namespace='/test',
                query_string=f'token={token}'
            )

            # Initial connection and join
            client.connect(namespace='/test')
            time.sleep(0.1)  # Wait for connection
            client.emit('join', {'universe_id': universe.id}, namespace='/test')
            time.sleep(0.1)  # Wait for join

            # Simulate disconnection
            client.disconnect(namespace='/test')

            # Reconnect
            client = SocketIOTestClient(
                app,
                socketio,
                namespace='/test',
                query_string=f'token={token}'
            )
            client.connect(namespace='/test')
            time.sleep(0.1)  # Wait for connection

            # Should be able to rejoin
            client.emit('join', {'universe_id': universe.id}, namespace='/test')
            time.sleep(0.1)  # Wait for join
            received = client.get_received(namespace='/test')
            assert any(event.get('name') == 'join_response' for event in received)

            # State should be preserved
            client.emit('get_state', {'universe_id': universe.id}, namespace='/test')
            time.sleep(0.1)  # Wait for state
            received = client.get_received(namespace='/test')
            assert any(
                event.get('name') == 'state_update' and
                event.get('args', [{}])[0].get('universe_id') == universe.id
                for event in received
            )

            # Clean up
            client.disconnect(namespace='/test')
            db.session.delete(universe)
            db.session.delete(user)
            db.session.commit()
