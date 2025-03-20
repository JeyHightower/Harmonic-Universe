"""Test fixtures for the Harmonic Universe application."""
import os
import pytest
from flask import Flask
from flask.testing import FlaskClient
from flask_jwt_extended import create_access_token
from app import create_app, db
from app.models import User
from .factories import (
    UserFactory,
    ProfileFactory,
    UniverseFactory,
    StoryboardFactory,
    SceneFactory,
    PhysicsObjectFactory,
    PhysicsConstraintFactory,
    VisualEffectFactory,
    AudioTrackFactory,
)


@pytest.fixture(scope="session")
def app():
    """Create a Flask application for testing."""
    os.environ["FLASK_ENV"] = "testing"
    app = create_app()
    app.config.update(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "SECRET_KEY": "test-key",
            "JWT_SECRET_KEY": "test-jwt-key",
            "WTF_CSRF_ENABLED": False,
            "SERVER_NAME": "localhost.localdomain",
        }
    )
    return app


@pytest.fixture(scope="session")
def _db(app):
    """Create a database for testing."""
    with app.app_context():
        db.create_all()
        yield db
        db.drop_all()


@pytest.fixture(scope="function")
def session(_db):
    """Create a new database session for a test."""
    connection = _db.engine.connect()
    transaction = connection.begin()

    session = _db.create_scoped_session(options={"bind": connection, "binds": {}})
    _db.session = session

    yield session

    transaction.rollback()
    connection.close()
    session.remove()


@pytest.fixture
def client(app):
    """Create a test client."""
    return app.test_client()


@pytest.fixture
def user(session):
    """Create a test user."""
    return UserFactory()


@pytest.fixture
def auth_headers(user):
    """Create authentication headers."""
    access_token = create_access_token(identity=user.id)
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
def profile(session, user):
    """Create a test profile."""
    return ProfileFactory(user=user)


@pytest.fixture
def universe(session, user):
    """Create a test universe."""
    return UniverseFactory(user=user)


@pytest.fixture
def storyboard(session, universe):
    """Create a test storyboard."""
    return StoryboardFactory(universe=universe)


@pytest.fixture
def scene(session, storyboard):
    """Create a test scene."""
    return SceneFactory(storyboard=storyboard)


@pytest.fixture
def physics_object(session, scene):
    """Create a test physics object."""
    return PhysicsObjectFactory(scene=scene)


@pytest.fixture
def physics_constraint(session, scene, physics_object):
    """Create a test physics constraint."""
    object_b = PhysicsObjectFactory(scene=scene)
    return PhysicsConstraintFactory(
        scene=scene, object_a=physics_object, object_b=object_b
    )


@pytest.fixture
def visual_effect(session, scene):
    """Create a test visual effect."""
    return VisualEffectFactory(scene=scene)


@pytest.fixture
def audio_track(session, scene):
    """Create a test audio track."""
    return AudioTrackFactory(scene=scene)


@pytest.fixture
def websocket_client(app):
    """Create a test WebSocket client."""
    from flask_socketio import SocketIOTestClient
    from app.websockets import socketio

    return SocketIOTestClient(app, socketio)


@pytest.fixture
def authenticated_websocket_client(app, user):
    """Create an authenticated test WebSocket client."""
    from flask_socketio import SocketIOTestClient
    from app.websockets import socketio

    access_token = create_access_token(identity=user.id)
    return SocketIOTestClient(
        app, socketio, headers={"Authorization": f"Bearer {access_token}"}
    )
