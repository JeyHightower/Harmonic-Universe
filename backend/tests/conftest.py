"""Test fixtures for backend tests."""
import os
import tempfile
import pytest
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.profile import Profile
from app.models.universe import Universe
from flask_jwt_extended import create_access_token
from app.models import Storyboard, Scene

@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    # Create a temporary file to isolate the database for each test
    db_fd, db_path = tempfile.mkstemp()

    app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_path}',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'SECRET_KEY': 'test'
    })

    # Create the database and load test data
    with app.app_context():
        db.create_all()
        yield app

    # Close and remove the temporary database
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()

class AuthActions:
    def __init__(self, client):
        self._client = client

    def login(self, email='test@example.com', password='test'):
        return self._client.post(
            '/api/auth/login',
            json={'email': email, 'password': password}
        )

    def logout(self):
        return self._client.post('/api/auth/logout')

@pytest.fixture
def auth(client):
    """Authentication helper."""
    return AuthActions(client)

@pytest.fixture
def test_user(app):
    """Create a test user."""
    with app.app_context():
        user = User(username='test', email='test@example.com')
        user.set_password('test')
        db.session.add(user)
        db.session.commit()
        return user

@pytest.fixture
def test_universe(app, test_user):
    """Create a test universe."""
    with app.app_context():
        universe = Universe(
            user_id=test_user.id,
            title='Test Universe',
            description='Test Description',
            is_public=True
        )
        db.session.add(universe)
        db.session.commit()
        return universe

@pytest.fixture
def test_storyboard(app, test_universe):
    """Create a test storyboard."""
    with app.app_context():
        storyboard = Storyboard(
            universe_id=test_universe.id,
            title='Test Storyboard',
            description='Test Description',
            metadata={'key': 'value'}
        )
        db.session.add(storyboard)
        db.session.commit()
        return storyboard

@pytest.fixture
def test_scene(app, test_storyboard):
    """Create a test scene."""
    with app.app_context():
        scene = Scene(
            storyboard_id=test_storyboard.id,
            title='Test Scene',
            sequence=0,
            content={'key': 'value'}
        )
        db.session.add(scene)
        db.session.commit()
        return scene

@pytest.fixture
def _db(app):
    """Create database for testing."""
    return db

@pytest.fixture(autouse=True)
def _init_db(_db):
    """Initialize database before each test."""
    db.create_all()
    yield
    db.session.remove()
    db.drop_all()

@pytest.fixture
def user(app):
    """Create test user."""
    with app.app_context():
        user = User(
            username='testuser',
            email='test@example.com'
        )
        user.set_password('password123')
        db.session.add(user)
        db.session.commit()
        return user

@pytest.fixture
def auth_headers(app, user):
    """Create authentication headers."""
    with app.app_context():
        access_token = create_access_token(identity=user.id)
        return {'Authorization': f'Bearer {access_token}'}

@pytest.fixture
def user_with_profile(app, user):
    """Create test user with profile."""
    with app.app_context():
        profile = Profile(
            user_id=user.id,
            bio='Test bio',
            preferences={'theme': 'dark'}
        )
        db.session.add(profile)
        db.session.commit()
        return user

@pytest.fixture
def universe_factory(app, user):
    """Factory for creating test universes."""
    def _universe_factory(user_id=None, **kwargs):
        with app.app_context():
            universe = Universe(
                name=kwargs.get('name', 'Test Universe'),
                description=kwargs.get('description', 'Test Description'),
                user_id=user_id or user.id,
                is_public=kwargs.get('is_public', True)
            )
            db.session.add(universe)
            db.session.commit()
            return universe
    return _universe_factory

@pytest.fixture
def user_factory(app):
    """Factory for creating test users."""
    def _user_factory(**kwargs):
        with app.app_context():
            user = User(
                username=kwargs.get('username', 'testuser2'),
                email=kwargs.get('email', 'test2@example.com')
            )
            user.set_password(kwargs.get('password', 'password123'))
            db.session.add(user)
            db.session.commit()
            return user
    return _user_factory
