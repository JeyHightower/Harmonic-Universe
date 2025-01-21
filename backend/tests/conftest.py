"""Test configuration and fixtures."""
import pytest
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIOTestClient
from app import create_app
from app.extensions import db as _db, socketio
from app.models import Universe, PhysicsParameters
from sqlalchemy.orm import scoped_session, sessionmaker
from flask_jwt_extended import create_access_token
import time
from app.sockets.physics_handler import PhysicsNamespace

# Import all models to ensure they're registered
from app.models.user import User
from app.models.universe import Universe
from app.models.comment import Comment
from app.models.favorite import Favorite
from app.models.storyboard import Storyboard
from app.models.version import Version
from app.models.template import Template
from app.models.music_parameters import MusicParameters
from app.models.visualization_parameters import VisualizationParameters
from app.models.audio_parameters import AudioParameters

@pytest.fixture(scope='function')
def app():
    """Create a test application."""
    app = create_app('test', testing=True)
    app.config.update({
        'TESTING': True,
        'DEBUG': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'SOCKETIO_TEST_MODE': True,
        'SOCKETIO_MESSAGE_QUEUE': None,
        'SECRET_KEY': 'test_key'
    })

    # Store the current app context
    ctx = app.app_context()
    ctx.push()

    # Create tables
    _db.create_all()

    yield app

    # Clean up
    _db.session.remove()
    _db.drop_all()
    ctx.pop()

@pytest.fixture(scope='function')
def test_client(app):
    """Create a test client."""
    return app.test_client()

@pytest.fixture(scope='function')
def socket_client(app):
    """Create a WebSocket test client."""
    flask_test_client = app.test_client()
    socket_client = SocketIOTestClient(app, socketio, flask_test_client=flask_test_client, namespace='/physics')
    return socket_client

@pytest.fixture(scope='function')
def db(app):
    """Create database for testing."""
    return _db

@pytest.fixture(scope='function')
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

@pytest.fixture(scope='function')
def universe(app):
    """Create a test universe."""
    universe = Universe(
        name="Test Universe",
        description="A universe for testing physics",
        user_id=1
    )
    _db.session.add(universe)
    _db.session.commit()
    return universe

@pytest.fixture(scope='function')
def physics_parameters(app, universe):
    """Create physics parameters for testing."""
    params = PhysicsParameters(
        universe=universe,
        gravity=9.81,
        elasticity=0.7,
        friction=0.3,
        air_resistance=0.1,
        density=1.0,
        time_scale=1.0,
        max_time_step=1/60
    )
    _db.session.add(params)
    _db.session.commit()
    return params

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

@pytest.fixture(autouse=True)
def clear_namespace_state():
    """Clear namespace state before each test."""
    # Get the physics namespace instance
    physics_namespace = None
    for namespace in socketio.server.namespace_handlers.values():
        if isinstance(namespace, PhysicsNamespace):
            physics_namespace = namespace
            break

    if physics_namespace:
        physics_namespace.cleanup()

    yield
