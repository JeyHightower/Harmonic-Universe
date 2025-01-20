from app.config import TestConfig
import os
import pytest
from flask_sqlalchemy import SQLAlchemy
from app import create_app
from app.models import db as _db
from sqlalchemy.orm import scoped_session, sessionmaker
from flask_jwt_extended import create_access_token
import time

# Import all models to ensure they're registered
from app.models.user import User
from app.models.universe import Universe
from app.models.comment import Comment
from app.models.favorite import Favorite
from app.models.storyboard import Storyboard
from app.models.version import Version
from app.models.template import Template
from app.models.physics_parameters import PhysicsParameters
from app.models.music_parameters import MusicParameters
from app.models.visualization_parameters import VisualizationParameters
from app.models.audio_parameters import AudioParameters

@pytest.fixture(scope='session')
def app():
    """Create application for the tests."""
    app = create_app(TestConfig)
    return app

@pytest.fixture(scope='session')
def db(app):
    """Create database for the tests."""
    with app.app_context():
        _db.app = app
        _db.create_all()
        yield _db
        _db.drop_all()

@pytest.fixture(scope='function')
def session(db, app):
    """Create a new database session for a test."""
    with app.app_context():
        connection = db.engine.connect()
        transaction = connection.begin()

        # Create a session factory bound to the connection
        session_factory = sessionmaker(bind=connection)
        session = scoped_session(session_factory)

        # Start with a clean slate for each test
        db.session = session
        db.drop_all()  # Drop all tables
        db.create_all()  # Recreate tables

        yield session

        # Cleanup
        session.close()
        transaction.rollback()
        connection.close()

@pytest.fixture(scope='function')
def client(app):
    """Create test client."""
    return app.test_client()

@pytest.fixture(scope='function')
def test_user(session):
    """Create a test user."""
    import uuid
    unique_id = str(uuid.uuid4())[:8]
    user = User(
        username=f'testuser_{unique_id}',
        email=f'test_{unique_id}@example.com'
    )
    user.set_password('password123')
    session.add(user)
    session.commit()
    return user

@pytest.fixture
def auth_headers(app, test_user):
    """Return auth headers for testing."""
    with app.app_context():
        token = create_access_token(identity=test_user.id)
        return {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

@pytest.fixture(scope='session')
def test_server(app):
    """Start test server in a separate thread."""
    from threading import Thread
    import socket

    def wait_for_port(port, host='localhost', timeout=5.0):
        start_time = time.perf_counter()
        while True:
            try:
                with socket.create_connection((host, port), timeout=timeout):
                    break
            except OSError:
                if time.perf_counter() - start_time >= timeout:
                    raise TimeoutError()
                time.sleep(0.1)

    thread = Thread(target=app.run, kwargs={'port': 5000})
    thread.daemon = True
    thread.start()

    try:
        wait_for_port(5000)
    except TimeoutError:
        pytest.fail("Server failed to start")

    yield

@pytest.fixture
def test_universe(test_user, session):
    """Create a test universe with parameters."""
    universe = Universe(
        name='Test Universe',  # Changed from title
        description='Test Description',
        is_public=True,  # Changed from visibility
        user_id=test_user.id
    )

    physics = PhysicsParameters(
        gravity=9.81,
        friction=0.5,
        elasticity=0.7
    )

    music = MusicParameters(
        key='C',
        scale='major',
        tempo=120
    )

    universe.physics_parameters = physics
    universe.music_parameters = music

    session.add(universe)
    session.commit()
    return universe
