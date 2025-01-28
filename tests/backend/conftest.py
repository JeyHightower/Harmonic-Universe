import eventlet
eventlet.monkey_patch()

import os
import tempfile
import pytest
import time
from app import create_app, db
from app.models.user import User
from app.models.universe import Universe
import jwt
from datetime import datetime, timedelta
from flask_socketio import SocketIO, SocketIOTestClient
from flask_jwt_extended import create_access_token
from app.extensions import socketio
import threading
from collections import deque
import traceback
from sqlalchemy.orm import scoped_session, sessionmaker

def pytest_configure(config):
    """Configure pytest."""
    import eventlet
    eventlet.monkey_patch()

class TestSocketIOClient:
    def __init__(self, app, namespace=None):
        self.app = app
        self.namespace = namespace or '/test'
        self.client = None
        self.received_events = deque(maxlen=100)  # Limit size to prevent memory issues
        self.sid = None
        self.eio_sid = None
        self._connected = False
        print(f"Initializing TestSocketIOClient with namespace: {self.namespace}")

    def connect(self, auth=None):
        """Connect to the server."""
        try:
            print(f"Attempting to connect with auth: {auth}")
            if auth and 'token' in auth:
                self.client = SocketIOTestClient(
                    self.app,
                    socketio,
                    namespace=self.namespace,
                    auth=auth
                )
            else:
                self.client = SocketIOTestClient(
                    self.app,
                    socketio,
                    namespace=self.namespace
                )

            # Wait for connection to be established
            time.sleep(0.1)

            # Store both session IDs
            if hasattr(self.client, 'eio_sid'):
                self.eio_sid = self.client.eio_sid
                print(f"Connected with eio_sid: {self.eio_sid}")
            if hasattr(self.client, 'sid'):
                self.sid = self.client.sid
                print(f"Connected with sid: {self.sid}")

            # Check connection status
            self._connected = self.client.is_connected(namespace=self.namespace)
            if self._connected:
                print(f"Successfully connected to namespace {self.namespace}")
                # Wait for any initial events
                time.sleep(0.1)
                self._process_received_events()
            else:
                print("Failed to establish connection")

            return self._connected

        except Exception as e:
            print(f"Connection error: {str(e)}")
            traceback.print_exc()
            return False

    def disconnect(self):
        """Disconnect from the server."""
        try:
            if self.client and self._connected:
                print(f"Disconnecting from namespace {self.namespace}")
                self.client.disconnect(namespace=self.namespace)
                time.sleep(0.1)  # Wait for disconnection to complete
                self.sid = None
                self.eio_sid = None
                self._connected = False
                print("Successfully disconnected")
        except Exception as e:
            print(f"Disconnect error: {str(e)}")
            traceback.print_exc()

    def emit(self, event, data=None, namespace=None):
        """Emit an event."""
        namespace = namespace or self.namespace
        try:
            if not self.client or not self._connected:
                print("Cannot emit: client not connected")
                return False

            print(f"Emitting event '{event}' with data: {data}")
            if isinstance(data, dict):
                # Include both session IDs if available
                if self.sid:
                    data['sid'] = self.sid
                if self.eio_sid:
                    data['eio_sid'] = self.eio_sid
            else:
                data = {
                    'data': data,
                    'sid': self.sid,
                    'eio_sid': self.eio_sid
                }

            self.client.emit(event, data, namespace=namespace)
            time.sleep(0.1)  # Give time for event processing
            self._process_received_events()
            return True

        except Exception as e:
            print(f"Emit error: {str(e)}")
            traceback.print_exc()
            return False

    def _process_received_events(self):
        """Process and store received events."""
        try:
            if not self.client:
                return

            events = self.client.get_received(namespace=self.namespace)
            for event in events:
                # Only store events meant for this client
                if (not event.get('room') or
                    event.get('room') == self.sid or
                    event.get('room') == self.eio_sid or
                    (isinstance(event.get('room'), str) and
                     event.get('room').startswith('user_'))):
                    self.received_events.append(event)
                    print(f"Received event: {event}")

        except Exception as e:
            print(f"Error processing events: {str(e)}")
            traceback.print_exc()

    def get_received(self, namespace=None):
        """Get received events."""
        namespace = namespace or self.namespace
        try:
            if not self.client or not self._connected:
                print("Cannot get events: client not connected")
                return []

            # Process any new events
            self._process_received_events()

            # Return all stored events
            return list(self.received_events)

        except Exception as e:
            print(f"Get received error: {str(e)}")
            traceback.print_exc()
            return []

    def is_connected(self, namespace=None):
        """Check if connected."""
        namespace = namespace or self.namespace
        try:
            if not self.client:
                return False
            self._connected = self.client.is_connected(namespace=namespace)
            return self._connected
        except Exception as e:
            print(f"Connection check error: {str(e)}")
            traceback.print_exc()
            return False

    def wait_for_event(self, event_name, timeout=5.0):
        """Wait for a specific event to be received."""
        start_time = time.time()
        while time.time() - start_time < timeout:
            events = self.get_received()
            for event in events:
                if event.get('name') == event_name:
                    return event
            time.sleep(0.1)
        return None

def create_test_token(user_id, expires_delta=None):
    """Create a test JWT token."""
    if expires_delta is None:
        expires_delta = timedelta(hours=1)
    return create_access_token(
        identity=user_id,
        expires_delta=expires_delta
    )

@pytest.fixture(scope='session')
def app():
    """Create and configure a new app instance for each test session."""
    app = create_app('testing')

    app.config.update({
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'TESTING': True,
        'SOCKETIO_ASYNC_MODE': 'threading',
        'SOCKETIO_MANAGE_SESSION': False,
        'SOCKETIO_MESSAGE_QUEUE': None,
        'SOCKETIO_PING_TIMEOUT': 2,
        'SOCKETIO_PING_INTERVAL': 5
    })

    # Push an application context
    ctx = app.app_context()
    ctx.push()

    # Create all tables
    db.create_all()

    yield app

    # Clean up
    db.session.remove()
    db.drop_all()
    ctx.pop()

@pytest.fixture(scope='function')
def session(app):
    """Create a new database session for a test."""
    # Connect to the database and create the schema
    connection = db.engine.connect()
    transaction = connection.begin()

    # Create a session factory bound to this connection
    session_factory = sessionmaker(bind=connection)
    session = scoped_session(session_factory)

    # Replace the default session with our test session
    old_session = db.session
    db.session = session

    yield session

    # Rollback the transaction and remove the session
    transaction.rollback()
    connection.close()
    session.remove()

    # Restore the default session
    db.session = old_session

@pytest.fixture(scope='function')
def test_user(session):
    """Create a test user."""
    user = User(
        username='testuser',
        email='test@example.com'
    )
    user.set_password('password123')
    session.add(user)
    session.commit()
    return user

@pytest.fixture(scope='function')
def test_universe(session, test_user):
    """Create a test universe."""
    universe = Universe(
        name='Test Universe',
        description='Test Description',
        creator=test_user,
        owner=test_user
    )
    session.add(universe)
    session.commit()
    return universe

@pytest.fixture(scope='function')
def auth_token(test_user):
    """Create an authentication token."""
    return create_test_token(test_user.id)

@pytest.fixture(scope='function')
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture(scope='function')
def socketio_test_client(app, session):
    """Create a SocketIO test client."""
    client = TestSocketIOClient(app)
    yield client
    client.disconnect()

@pytest.fixture(autouse=True)
def _push_request_context(app):
    """Push a request context for each test."""
    ctx = app.test_request_context()
    ctx.push()
    yield
    ctx.pop()

@pytest.fixture(scope='function')
def runner(app):
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()

@pytest.fixture
def socketio_client(app):
    """A test client for SocketIO."""
    return TestSocketIOClient(app, namespace='/test')

@pytest.fixture(scope='function')
def auth_headers(app, test_user):
    """Get auth headers for test user."""
    with app.app_context():
        # Ensure user is attached to session
        db.session.add(test_user)
        access_token = create_access_token(identity=test_user.id)
        return {'Authorization': f'Bearer {access_token}'}

@pytest.fixture(scope='function')
def auth_client(client, auth_headers):
    """A test client with auth headers."""
    client.environ_base.update({
        'HTTP_AUTHORIZATION': auth_headers['Authorization']
    })
    return client

@pytest.fixture(scope='function')
def auth_socketio_client(app, test_user):
    """Create an authenticated SocketIO test client."""
    token = create_test_token(test_user.id)
    client = TestSocketIOClient(app, namespace='/test')
    connected = client.connect(auth={'token': token})

    if not connected:
        pytest.fail("Failed to connect authenticated SocketIO client")

    yield client

    client.disconnect()

@pytest.fixture(scope='function')
def unauthenticated_socketio_client(app):
    """Create an unauthenticated SocketIO test client."""
    client = TestSocketIOClient(app, namespace='/test')
    connected = client.connect()

    if not connected:
        pytest.fail("Failed to connect unauthenticated SocketIO client")

    yield client

    client.disconnect()

@pytest.fixture(scope='function')
def two_connected_clients(app, test_user):
    """Create two authenticated clients connected to the same universe."""
    # Create tokens
    token1 = create_test_token(test_user.id)
    token2 = create_test_token(test_user.id)

    # Create clients
    client1 = TestSocketIOClient(app, namespace='/test')
    client2 = TestSocketIOClient(app, namespace='/test')

    # Connect clients
    if not client1.connect(auth={'token': token1}):
        pytest.fail("Failed to connect first client")
    if not client2.connect(auth={'token': token2}):
        pytest.fail("Failed to connect second client")

    yield client1, client2

    # Cleanup
    client1.disconnect()
    client2.disconnect()

@pytest.fixture(scope='function')
def universe_with_connected_clients(app, test_user, test_universe):
    """Create a universe and connect two clients to it."""
    # Create tokens
    token1 = create_test_token(test_user.id)
    token2 = create_test_token(test_user.id)

    # Create clients
    client1 = TestSocketIOClient(app, namespace='/test')
    client2 = TestSocketIOClient(app, namespace='/test')

    # Connect clients
    if not client1.connect(auth={'token': token1}):
        pytest.fail("Failed to connect first client")
    if not client2.connect(auth={'token': token2}):
        pytest.fail("Failed to connect second client")

    # Join universe room
    universe_data = {'universe_id': test_universe.id}
    client1.emit('join', universe_data)
    client2.emit('join', universe_data)

    # Wait for join confirmations
    if not client1.wait_for_event('joined'):
        pytest.fail("First client failed to join universe")
    if not client2.wait_for_event('joined'):
        pytest.fail("Second client failed to join universe")

    yield test_universe, client1, client2

    # Cleanup
    client1.disconnect()
    client2.disconnect()

def verify_event_received(client, event_name, timeout=5.0):
    """Verify that a client received a specific event."""
    event = client.wait_for_event(event_name, timeout)
    if not event:
        pytest.fail(f"Did not receive expected event: {event_name}")
    return event

def verify_event_not_received(client, event_name, timeout=1.0):
    """Verify that a client did not receive a specific event."""
    event = client.wait_for_event(event_name, timeout)
    if event:
        pytest.fail(f"Received unexpected event: {event_name}")
    return True

def emit_and_verify(client, emit_event, emit_data, expect_event, timeout=5.0):
    """Emit an event and verify the expected response is received."""
    if not client.emit(emit_event, emit_data):
        pytest.fail(f"Failed to emit event: {emit_event}")
    return verify_event_received(client, expect_event, timeout)

@pytest.fixture
def app_context(app):
    """An application context for the tests."""
    with app.app_context() as ctx:
        yield ctx

def depth_first_traversal(path):
    for root, dirs, files in os.walk(path):
        for name in files:
            print(os.path.join(root, name))
        for name in dirs:
            depth_first_traversal(os.path.join(root, name))

# Start the traversal from the root directory
depth_first_traversal('harmonic-universe/')

