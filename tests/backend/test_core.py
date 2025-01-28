import pytest
from app import create_app
from app.models.user import User
from app.extensions import db, socketio
from flask_jwt_extended import create_access_token
from app.models import Universe
import json
import time
from tests.conftest import TestSocketIOClient

@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.close()
        db.drop_all()

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def socketio_client(app):
    """A test client for SocketIO."""
    return TestSocketIOClient(app, namespace='/test')

class TestCore:
    """Core functionality tests covering auth, CRUD, and basic websocket operations"""

    def test_auth_flow(self, app, client):
        """Test complete authentication flow including register and login"""
        with app.app_context():
            # Register
            register_data = {
                'username': 'testuser',
                'email': 'test@example.com',
                'password': 'password123'
            }
            register_response = client.post('/api/auth/register',
                json=register_data,
                headers={'Content-Type': 'application/json'}
            )
            assert register_response.status_code == 201
            register_data = json.loads(register_response.data)
            assert register_data['username'] == 'testuser'

            # Login
            login_response = client.post('/api/auth/login', json={
                'email': 'test@example.com',
                'password': 'password123'
            })
            assert login_response.status_code == 200
            login_data = json.loads(login_response.data)
            assert 'access_token' in login_data

            # Verify profile access
            headers = {'Authorization': f'Bearer {login_data["access_token"]}'}
            profile_response = client.get('/api/auth/user', headers=headers)
            assert profile_response.status_code == 200
            profile_data = json.loads(profile_response.data)
            assert profile_data['username'] == 'testuser'

            # Clean up
            user = User.query.filter_by(email='test@example.com').first()
            if user:
                db.session.delete(user)
                db.session.commit()

    def test_universe_lifecycle(self, app, client, socketio_client, test_user):
        """Test complete universe lifecycle including CRUD and realtime operations"""
        with app.app_context():
            # Login to get token
            response = client.post('/api/auth/login', json={
                'email': 'test@example.com',
                'password': 'testpass'
            })
            assert response.status_code == 200
            token = response.json['access_token']

            # Connect to websocket with token
            print(f"Connecting with token: {token}")

            # Disconnect first if already connected
            if socketio_client.is_connected():
                socketio_client.disconnect()

            # Connect with retry logic
            max_retries = 3
            connected = False

            for attempt in range(max_retries):
                print(f"Connection attempt {attempt + 1}")
                if socketio_client.connect(auth={'token': token}):
                    connected = True
                    print("Socket connected successfully")
                    break

                print("Connection attempt failed, retrying...")
                time.sleep(0.5)

            assert connected, "Failed to establish websocket connection"

            # Wait and verify connection events
            max_event_checks = 5
            connection_confirmed = False

            for check in range(max_event_checks):
                print(f"Checking for connection confirmation: attempt {check + 1}")
                received = socketio_client.get_received()
                print(f"Received events: {received}")

                if any(event['name'] in ['connected', 'connect_confirmed'] for event in received):
                    connection_confirmed = True
                    break

                time.sleep(0.5)

            assert connection_confirmed, "Did not receive connection confirmation"

            # Create universe
            response = client.post('/api/universes',
                headers={'Authorization': f'Bearer {token}'},
                json={'name': 'Test Universe'})
            assert response.status_code == 201
            universe_id = response.json['id']

            # Verify universe exists
            universe = Universe.query.get(universe_id)
            assert universe is not None
            assert universe.name == 'Test Universe'

            # Cleanup
            socketio_client.disconnect()

    def test_collaboration(self, app, client):
        """Test collaboration features including chat and cursor tracking"""
        with app.app_context():
            # Create owner user
            owner = User(username='owner', email='owner@example.com')
            owner.set_password('password123')
            db.session.add(owner)
            db.session.commit()

            # Get owner token
            owner_token = create_access_token(identity=owner.id)
            owner_headers = {'Authorization': f'Bearer {owner_token}'}

            # Create universe
            universe_data = {
                'name': 'Collab Universe',
                'description': 'A collaborative universe',
                'is_public': True
            }
            universe_response = client.post('/api/universes',
                json=universe_data,
                headers=owner_headers
            )
            assert universe_response.status_code == 201
            universe_data = json.loads(universe_response.data)
            universe_id = universe_data['id']

            # Create collaborator
            collaborator = User(username='collaborator', email='collab@example.com')
            collaborator.set_password('password123')
            db.session.add(collaborator)
            db.session.commit()

            # Add collaborator
            collab_add_response = client.post(
                f'/api/universes/{universe_id}/collaborators',
                json={'email': collaborator.email},
                headers=owner_headers
            )
            assert collab_add_response.status_code == 201

            # Create socketio clients
            owner_client = TestSocketIOClient(app, namespace='/test')
            owner_client.connect(auth={'token': owner_token})

            collaborator_token = create_access_token(identity=collaborator.id)
            collab_client = TestSocketIOClient(app, namespace='/test')
            collab_client.connect(auth={'token': collaborator_token})

            # Join universe with both clients
            owner_client.emit('join', {'universe_id': universe_id})
            collab_client.emit('join', {'universe_id': universe_id})

            # Test chat
            chat_data = {
                'universe_id': universe_id,
                'message': 'Hello, Universe!',
                'type': 'chat'
            }
            owner_client.emit('chat_message', chat_data)

            # Both clients should receive the message
            owner_received = owner_client.get_received()
            collab_received = collab_client.get_received()

            assert any(
                event.get('name') == 'chat_message' and
                event.get('args')[0].get('message') == 'Hello, Universe!'
                for event in owner_received
            )
            assert any(
                event.get('name') == 'chat_message' and
                event.get('args')[0].get('message') == 'Hello, Universe!'
                for event in collab_received
            )

            # Test cursor tracking
            cursor_data = {
                'universe_id': universe_id,
                'position': {'x': 100, 'y': 100}
            }
            owner_client.emit('cursor_move', cursor_data)

            # Collaborator should receive cursor update
            collab_received = collab_client.get_received()
            assert any(
                event.get('name') == 'cursor_moved' and
                event.get('args')[0].get('position') == {'x': 100, 'y': 100}
                for event in collab_received
            )

            # Clean up
            owner_client.disconnect()
            collab_client.disconnect()
            universe = Universe.query.get(universe_id)
            if universe:
                db.session.delete(universe)
            db.session.delete(owner)
            db.session.delete(collaborator)
            db.session.commit()
