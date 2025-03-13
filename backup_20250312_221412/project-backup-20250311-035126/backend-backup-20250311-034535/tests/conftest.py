import os
import sys
import pytest
import eventlet

eventlet.monkey_patch()

# Add the project root directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app import create_app, db
from backend.app.models import (
    User,
    Universe,
    Storyboard,
    Scene,
    VisualEffect,
    AudioTrack,
    PhysicsParameters,
    Profile,
    PhysicsObject,
    PhysicsConstraint,
    Activity,
    Collaborator,
)
import jwt
from datetime import datetime, timedelta
from flask_socketio import SocketIO, SocketIOTestClient
from flask_jwt_extended import create_access_token
from backend.app.extensions import socketio
import threading
from collections import deque
import traceback
from sqlalchemy.orm import scoped_session, sessionmaker
from app.config import Config


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    WTF_CSRF_ENABLED = False


@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    app = create_app(TestConfig)

    # Create tables
    with app.app_context():
        db.create_all()

    yield app

    # Clean up
    with app.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture(scope="session")
def db(app):
    """Create database for the tests."""
    db.app = app
    db.create_all()

    yield db

    db.drop_all()


@pytest.fixture(scope="function")
def session(db):
    """Create a new database session for a test."""
    connection = db.engine.connect()
    transaction = connection.begin()

    options = dict(bind=connection, binds={})
    session = db.create_scoped_session(options=options)

    db.session = session

    yield session

    session.close()
    transaction.rollback()
    connection.close()
    session.remove()


@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()


@pytest.fixture
def test_user(app):
    """Create a test user."""
    with app.app_context():
        user = User(username="test_user", email="test@example.com")
        user.set_password("password123")
        db.session.add(user)
        db.session.commit()
        return user


@pytest.fixture
def test_universe(test_user, session):
    """Create a test universe."""
    universe = Universe(
        name="Test Universe",
        description="Test Description",
        user_id=test_user.id,
        is_public=False,
        max_participants=10,
        collaborators_count=0,
        music_parameters={},
        visual_parameters={},
    )
    session.add(universe)
    session.commit()
    return universe


@pytest.fixture
def auth_headers(client, test_user):
    """Get auth headers for test user."""
    response = client.post(
        "/api/auth/login", json={"email": test_user.email, "password": "password123"}
    )
    token = response.json["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_storyboard(test_universe, session):
    """Create a test storyboard."""
    storyboard = Storyboard(
        name="Test Storyboard",
        description="Test Description",
        universe_id=test_universe.id,
    )
    session.add(storyboard)
    session.commit()
    return storyboard


@pytest.fixture
def test_scene(test_storyboard, session):
    """Create a test scene."""
    scene = Scene(
        name="Test Scene",
        description="Test Description",
        sequence=1,
        content={"layout": "grid", "elements": []},
        storyboard_id=test_storyboard.id,
    )
    session.add(scene)
    session.commit()
    return scene


@pytest.fixture
def test_visual_effect(test_scene, session):
    """Create a test visual effect."""
    effect = VisualEffect(
        name="Test Effect",
        effect_type="particle",
        parameters={
            "particle_count": 100,
            "particle_size": 5,
            "particle_color": "#FFFFFF",
        },
        scene_id=test_scene.id,
    )
    session.add(effect)
    session.commit()
    return effect


@pytest.fixture
def test_audio_track(test_scene, session):
    """Create a test audio track."""
    track = AudioTrack(
        name="Test Track",
        track_type="background",
        file_path="/path/to/test.mp3",
        parameters={"volume": 1.0, "loop": True, "fade_in": 2.0},
        scene_id=test_scene.id,
    )
    session.add(track)
    session.commit()
    return track


@pytest.fixture
def test_profile(test_user, session):
    """Create a test profile."""
    profile = Profile(
        user_id=test_user.id,
        display_name="Test Display Name",
        bio="Test Bio",
        avatar_url="https://example.com/avatar.jpg",
    )
    session.add(profile)
    session.commit()
    return profile


@pytest.fixture
def test_physics_object(test_scene, session):
    """Create a test physics object."""
    physics_object = PhysicsObject(
        name="Test Physics Object",
        object_type="circle",
        position={"x": 0, "y": 0},
        velocity={"x": 0, "y": 0},
        mass=1.0,
        restitution=0.5,
        friction=0.2,
        parameters={"radius": 10, "color": "#FF0000", "is_static": False},
        scene_id=test_scene.id,
    )
    session.add(physics_object)
    session.commit()
    return physics_object


@pytest.fixture
def test_physics_constraint(test_scene, test_physics_object, session):
    """Create a test physics constraint."""
    # Create another physics object for the constraint
    physics_object_b = PhysicsObject(
        name="Test Physics Object B",
        object_type="circle",
        position={"x": 100, "y": 0},
        velocity={"x": 0, "y": 0},
        mass=1.0,
        restitution=0.5,
        friction=0.2,
        parameters={"radius": 10, "color": "#00FF00", "is_static": False},
        scene_id=test_scene.id,
    )
    session.add(physics_object_b)
    session.commit()

    constraint = PhysicsConstraint(
        name="Test Constraint",
        constraint_type="distance",
        parameters={"stiffness": 1.0, "damping": 0.1, "length": 100},
        object_a_id=test_physics_object.id,
        object_b_id=physics_object_b.id,
        scene_id=test_scene.id,
    )
    session.add(constraint)
    session.commit()
    return constraint


@pytest.fixture
def test_activity(test_universe, test_user, session):
    """Create a test activity."""
    activity = Activity(
        universe_id=test_universe.id,
        user_id=test_user.id,
        action="create",
        target="scene",
        details={"scene_id": 1, "scene_name": "Test Scene"},
    )
    session.add(activity)
    session.commit()
    return activity


@pytest.fixture
def test_collaborator(test_universe, test_user, session):
    """Create a test collaborator."""
    collaborator = Collaborator(
        user_id=test_user.id,
        universe_id=test_universe.id,
        role="editor",
        permissions={"can_edit": True, "can_delete": False, "can_invite": False},
    )
    session.add(collaborator)
    session.commit()
    return collaborator


@pytest.fixture
def socketio_client(app):
    """Create a test SocketIO client."""
    client = SocketIOTestClient(app, socketio)
    return client
