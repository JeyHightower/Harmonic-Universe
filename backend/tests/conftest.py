"""Test fixtures for backend tests."""
import os
import tempfile
import pytest
from app import create_app, db
from app.extensions import jwt
from app.models import User, Profile, Universe, Storyboard, Scene
from app.models.base_models import db as models_db
from app.models.collaborator import Collaborator
from app.models.activity import Activity
from app.models.association_tables import universe_collaborators, universe_access
from flask_jwt_extended import create_access_token
from contextlib import contextmanager
from werkzeug.security import generate_password_hash
from flask import current_app
from sqlalchemy import event
from sqlalchemy.orm import scoped_session, sessionmaker

@pytest.fixture(scope='session')
def app():
    """Create and configure a new app instance for each test."""
    # Create a temporary file for the test database
    db_fd, db_path = tempfile.mkstemp()

    # Create app with testing config
    app = create_app("testing")

    # Configure for testing with file-based SQLite
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_path}",
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
        "JWT_SECRET_KEY": "test-secret-key"
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
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture(scope='function')
def app_context(app):
    """Create an application context for tests."""
    with app.app_context() as ctx:
        yield ctx

@pytest.fixture(scope='function')
def session(app_context):
    """Create a new database session for a test."""
    # Get connection with serializable isolation level
    connection = db.engine.connect()
    connection = connection.execution_options(isolation_level="SERIALIZABLE")

    # Start transaction
    transaction = connection.begin()

    # Create session bound to our connection
    session_factory = sessionmaker(bind=connection)
    session = scoped_session(session_factory)

    # Make this session the current one
    db.session = session

    # Create all tables
    db.create_all()

    # Begin a nested transaction (using SAVEPOINT)
    session.begin_nested()

    # Each time a SAVEPOINT ends, reopen it
    @event.listens_for(session, 'after_transaction_end')
    def restart_savepoint(session, transaction):
        if transaction.nested and not transaction._parent.nested:
            # Ensure we're still in a transaction
            session.begin_nested()

    yield session

    # Clean up
    session.close()
    transaction.rollback()
    connection.close()
    session.remove()

    # Drop all tables
    db.drop_all()

@pytest.fixture
def client(app):
    """Create a test client for the app."""
    return app.test_client()

@pytest.fixture
def test_user(session):
    """Create a test user."""
    user = User(
        username='testuser2',
        email='test2@example.com'
    )
    user.set_password('password123')
    session.add(user)
    session.commit()
    user.activate()  # This will set is_active to True
    session.commit()
    return user

@pytest.fixture
def auth_headers(test_user):
    """Create authentication headers for a test user."""
    # Ensure user ID is converted to string
    access_token = create_access_token(identity=str(test_user.id))
    return {'Authorization': f'Bearer {access_token}'}

@pytest.fixture
def test_universe(session, test_user):
    """Create a test universe."""
    universe = Universe(
        name="Test Universe",
        description="Test Description",
        user_id=test_user.id,
        is_public=True
    )
    session.add(universe)
    session.commit()
    return universe

@pytest.fixture
def test_storyboard(session, test_universe):
    """Create a test storyboard."""
    storyboard = Storyboard(
        title="Test Storyboard",
        description="Test Description",
        universe_id=test_universe.id
    )
    session.add(storyboard)
    session.commit()
    return storyboard

@pytest.fixture
def test_scene(session, test_storyboard):
    """Create a test scene."""
    scene = Scene(
        title="Test Scene",
        sequence=1,
        content={},
        storyboard_id=test_storyboard.id
    )
    session.add(scene)
    session.commit()
    return scene

@pytest.fixture
def runner(app):
    """Create a test runner."""
    return app.test_cli_runner()

@contextmanager
def session_scope(app):
    """Provide a transactional scope around a series of operations."""
    with app.app_context():
        try:
            yield db.session
            db.session.commit()
        except:
            db.session.rollback()
            raise
        finally:
            db.session.remove()

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

@pytest.fixture(scope='function')
def jwt_config(app):
    """Configure JWT settings for testing."""
    with app.app_context():
        # First, update the config
        app.config.update({
            'JWT_SECRET_KEY': 'test-jwt-secret-key',
            'JWT_TOKEN_LOCATION': ['headers'],
            'JWT_HEADER_NAME': 'Authorization',
            'JWT_HEADER_TYPE': 'Bearer',
            'JWT_ACCESS_TOKEN_EXPIRES': False,
            'JWT_ALGORITHM': 'HS256',
            'JWT_IDENTITY_CLAIM': 'sub',
            'PROPAGATE_EXCEPTIONS': True,
            'JWT_ERROR_MESSAGE_KEY': 'error',
            'JWT_DECODE_ALGORITHMS': ['HS256']
        })

        # Re-initialize JWT with the new config
        jwt.init_app(app)

        # Configure JWT error handlers
        @jwt.invalid_token_loader
        def invalid_token_callback(error_string):
            """Handle invalid token errors."""
            app.logger.error(f"Invalid token error: {error_string}")
            return {"error": "Invalid token", "message": error_string}, 401

        @jwt.unauthorized_loader
        def missing_token_callback(error_string):
            """Handle missing token errors."""
            app.logger.error(f"Missing token error: {error_string}")
            return {"error": "Authorization required", "message": error_string}, 401

        @jwt.expired_token_loader
        def expired_token_callback(_jwt_header, jwt_data):
            """Handle expired token errors."""
            app.logger.error("Token has expired")
            return {"error": "Token expired", "message": "The token has expired"}, 401

        # Configure JWT user lookup
        @jwt.user_lookup_loader
        def user_lookup_callback(_jwt_header, jwt_data):
            """Look up user from JWT data."""
            identity = jwt_data.get("sub")
            if not identity:
                app.logger.error("No identity found in JWT data")
                return None

            app.logger.debug(f"Looking up user with JWT identity: {identity}")
            try:
                user = User.query.get(identity)
                if user:
                    app.logger.debug(f"Found user {user.id} from JWT identity {identity}")
                    return user
                else:
                    app.logger.error(f"No user found in database for ID {identity}")
                    return None
            except Exception as e:
                app.logger.error(f"Error during user lookup: {str(e)}")
                return None

        app.logger.info("JWT configuration updated")
        return app.config

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
            # Ensure user is attached to session
            db.session.merge(user)

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
