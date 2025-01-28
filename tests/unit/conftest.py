"""Test configuration and fixtures.

This module contains all the pytest fixtures used across the test suite.
Fixtures are organized by their purpose and scope.
"""
import pytest
import time
from threading import Thread
import socket
from flask_socketio import SocketIOTestClient, SocketIO
from sqlalchemy.orm import scoped_session, sessionmaker
from flask_jwt_extended import create_access_token

from app import create_app
from app.extensions import db as _db, socketio

# Import all models
from app.models import User, Universe, Profile


@pytest.fixture(scope="session")
def app():
    """Create application for the tests."""
    app = create_app("testing")

    # Create the database and the database tables
    with app.app_context():
        _db.create_all()

    yield app

    # Cleanup after tests are done
    with app.app_context():
        _db.session.remove()
        _db.drop_all()


@pytest.fixture(scope="function")
def client(app):
    """Create a test client for the app."""
    return app.test_client()


@pytest.fixture(scope="function")
def db_session(app):
    """Create a new database session for a test."""
    with app.app_context():
        connection = _db.engine.connect()
        transaction = connection.begin()

        # Create a session with the connection
        session = scoped_session(sessionmaker(bind=connection, expire_on_commit=False))

        # Set the session for SQLAlchemy
        _db.session = session

        yield session

        # Cleanup
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture(scope="function")
def session(db_session):
    """Provide the transactional session to tests."""
    return db_session


@pytest.fixture(autouse=True)
def cleanup_db(session):
    """Clean up the database after each test."""
    yield
    session.rollback()
    for table in reversed(_db.metadata.sorted_tables):
        session.execute(table.delete())
    session.commit()


# User and Authentication Fixtures
@pytest.fixture(scope="function")
def test_user(session):
    """Create test user."""
    user = User(username="testuser", email="test@example.com")
    user.set_password("testpass123")
    session.add(user)
    session.commit()
    return user


@pytest.fixture(scope="function")
def auth_headers(app, test_user):
    """Get auth headers."""
    access_token = create_access_token(identity=test_user.id)
    return {"Authorization": f"Bearer {access_token}"}


# Universe and Parameters Fixtures
@pytest.fixture(scope="function")
def test_universe(session, test_user):
    """Create test universe."""
    universe = Universe(
        name="Test Universe",
        description="Test Description",
        is_public=True,
        creator_id=test_user.id,
    )
    session.add(universe)
    session.commit()
    return universe


@pytest.fixture(scope="function")
def test_profile(session, test_user):
    """Create a test profile."""
    profile = Profile(user_id=test_user.id, bio="Test Bio", location="Test Location")
    session.add(profile)
    session.commit()
    return profile


@pytest.fixture(scope="function")
def test_collaborator(session, test_user, test_universe):
    """Create a test collaborator."""
    # Add the user as a collaborator using the association table
    test_universe.collaborators.append(test_user)
    session.commit()
    return test_user


# WebSocket Fixtures
@pytest.fixture(scope="function")
def socket_client(app, test_user):
    """Create a WebSocket test client with authentication."""
    access_token = create_access_token(identity=test_user.id)
    client = SocketIOTestClient(
        app, socketio, auth={"token": access_token}, namespace="/physics"
    )
    return client


@pytest.fixture(scope="function")
def socketio(app):
    """Create SocketIO test client."""
    return SocketIO(app, message_queue=None)


@pytest.fixture(autouse=True)
def clear_namespace_state(app):
    """Clear WebSocket namespace state before each test."""
    # Skip if app is not initialized
    if not app:
        return

    # Initialize SocketIO if needed
    socketio = getattr(app, "socketio", None)
    if not socketio:
        socketio = SocketIO(app, message_queue=None)
        app.socketio = socketio

    # Clear namespace handlers if they exist
    if hasattr(socketio, "server") and hasattr(socketio.server, "namespace_handlers"):
        socketio.server.namespace_handlers.clear()


# Server Fixtures
@pytest.fixture(scope="session")
def test_server(app):
    """Start test server in a separate thread for integration tests."""

    def wait_for_port(port, host="localhost", timeout=5.0):
        start_time = time.perf_counter()
        while True:
            try:
                with socket.create_connection((host, port), timeout=timeout):
                    break
            except OSError:
                if time.perf_counter() - start_time >= timeout:
                    raise TimeoutError()
                time.sleep(0.1)

    thread = Thread(target=app.run, kwargs={"port": 5000})
    thread.daemon = True
    thread.start()

    try:
        wait_for_port(5000)
    except TimeoutError:
        pytest.fail("Server failed to start")

    yield
