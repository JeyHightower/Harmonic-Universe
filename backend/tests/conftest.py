"""Test fixtures for backend tests."""
import pytest
from app import create_app
from app.models.user import User
from app.models.profile import Profile
from app.models.universe import Universe
from app.models.physics_parameters import PhysicsParameters
from app.extensions import db
from flask_jwt_extended import create_access_token

@pytest.fixture
def app():
    """Create application for testing."""
    app = create_app('testing')

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()

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
    def _universe_factory(creator_id=None, **kwargs):
        with app.app_context():
            universe = Universe(
                name=kwargs.get('name', 'Test Universe'),
                description=kwargs.get('description', 'Test Description'),
                creator_id=creator_id or user.id,
                max_participants=kwargs.get('max_participants', 10),
                is_public=kwargs.get('is_public', True)
            )
            db.session.add(universe)
            db.session.commit()

            # Create physics parameters
            physics_params = PhysicsParameters(
                universe_id=universe.id,
                gravity=kwargs.get('gravity', 9.81),
                time_dilation=kwargs.get('time_dilation', 1.0)
            )
            db.session.add(physics_params)
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
