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
from sqlalchemy import create_engine

from app import create_app
from app.extensions import db as _db, socketio

# Import all models
from app.models import User, Universe, Profile, Base
from app.models.scene import Scene
from app.models.storyboard import Storyboard
from app.models.character import Character
from app.models.location import Location
from app.models.item import Item
from app.models.note import Note
from app.models.relationship import Relationship
from app.models.event import Event


@pytest.fixture(scope="session")
def app():
    """Create application for the tests."""
    _app = create_app("testing")
    _app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    _app.config["TESTING"] = True
    return _app


@pytest.fixture(scope="session")
def db(app):
    """Create database for the tests."""
    with app.app_context():
        _db.create_all()
        yield _db
        _db.drop_all()


@pytest.fixture(scope="function")
def client(app):
    """Create a test client for the app."""
    return app.test_client()


@pytest.fixture(scope="function")
def session(db):
    """Create a new database session for a test."""
    connection = db.engine.connect()
    transaction = connection.begin()
    options = dict(bind=connection, binds={})
    session = db.create_scoped_session(options=options)
    db.session = session

    yield session

    transaction.rollback()
    connection.close()
    session.remove()


@pytest.fixture(autouse=True)
def cleanup_db(session):
    """Clean up the database after each test."""
    yield
    session.rollback()
    for table in reversed(_db.metadata.sorted_tables):
        session.execute(table.delete())
    session.commit()


# User and Authentication Fixtures
@pytest.fixture
def test_user(session):
    """Create test user"""
    user = User(
        username="testuser",
        email="test@example.com",
        password="password123"
    )
    session.add(user)
    session.commit()
    return user


@pytest.fixture(scope="function")
def auth_headers(app, test_user):
    """Get auth headers."""
    access_token = create_access_token(identity=test_user.id)
    return {"Authorization": f"Bearer {access_token}"}


# Universe and Parameters Fixtures
@pytest.fixture
def test_universe(session, test_user):
    """Create test universe"""
    universe = Universe(
        name="Test Universe",
        description="A test universe",
        user_id=test_user.id,
        is_public=True
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


@pytest.fixture(scope="function")
def engine():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return engine


@pytest.fixture(scope="function")
def session(engine):
    connection = engine.connect()
    transaction = connection.begin()
    Session = scoped_session(sessionmaker(bind=connection))
    session = Session()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def test_storyboard(session, test_universe):
    """Create test storyboard"""
    storyboard = Storyboard(
        title="Test Storyboard",
        description="A test storyboard",
        universe_id=test_universe.id
    )
    session.add(storyboard)
    session.commit()
    return storyboard


@pytest.fixture
def test_scene(session, test_storyboard):
    """Create test scene"""
    scene = Scene(
        title="Test Scene",
        content="Test scene content",
        storyboard_id=test_storyboard.id,
        order=1
    )
    session.add(scene)
    session.commit()
    return scene


@pytest.fixture
def test_character(session, test_universe):
    """Create test character"""
    character = Character(
        name="Test Character",
        description="A test character",
        universe_id=test_universe.id
    )
    session.add(character)
    session.commit()
    return character


@pytest.fixture
def test_location(session, test_universe):
    """Create test location"""
    location = Location(
        name="Test Location",
        description="A test location",
        universe_id=test_universe.id
    )
    session.add(location)
    session.commit()
    return location


@pytest.fixture
def test_item(session, test_universe):
    """Create test item"""
    item = Item(
        name="Test Item",
        description="A test item",
        universe_id=test_universe.id
    )
    session.add(item)
    session.commit()
    return item


@pytest.fixture
def test_note(session, test_universe):
    """Create test note"""
    note = Note(
        title="Test Note",
        content="Test note content",
        universe_id=test_universe.id
    )
    session.add(note)
    session.commit()
    return note


@pytest.fixture
def test_relationship(session, test_character):
    """Create test relationship"""
    relationship = Relationship(
        name="Test Relationship",
        description="A test relationship",
        character_id=test_character.id
    )
    session.add(relationship)
    session.commit()
    return relationship


@pytest.fixture
def test_event(session, test_universe):
    """Create test event"""
    event = Event(
        title="Test Event",
        description="A test event",
        universe_id=test_universe.id
    )
    session.add(event)
    session.commit()
    return event
