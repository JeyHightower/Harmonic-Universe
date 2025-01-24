"""Test fixtures."""
import pytest
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIOTestClient
from app import create_app
from app.extensions import db as _db
from app.models import User, Universe, PhysicsParameters
from sqlalchemy.orm import scoped_session, sessionmaker
from flask_jwt_extended import create_access_token

@pytest.fixture(scope='session')
def app():
    """Create application for the tests."""
    app = create_app('testing')
    return app

@pytest.fixture(scope='session')
def db(app):
    """Create database for the tests."""
    with app.app_context():
        _db.create_all()
        yield _db
        _db.drop_all()

@pytest.fixture(autouse=True)
def cleanup_db(db):
    """Clean up database between tests."""
    yield
    for table in reversed(db.metadata.sorted_tables):
        db.session.execute(table.delete())
    db.session.commit()

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

@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()

@pytest.fixture
def test_user(session):
    """Create test user."""
    user = User(
        username='testuser',
        email='test@example.com'
    )
    user.set_password('password123')
    session.add(user)
    session.commit()
    return user

@pytest.fixture
def auth_headers(test_user):
    """Create authentication headers."""
    access_token = create_access_token(identity=test_user.id)
    return {'Authorization': f'Bearer {access_token}'}

@pytest.fixture
def test_universe(test_user, session):
    """Create test universe."""
    universe = Universe(
        name='Test Universe',
        description='A test universe',
        creator_id=test_user.id,
        is_public=True
    )
    session.add(universe)

    # Add physics parameters
    physics = PhysicsParameters(
        universe=universe,
        gravity=9.81,
        particle_speed=1.0
    )
    session.add(physics)
    session.commit()
    return universe

@pytest.fixture
def socket_client(app, test_user):
    """Create WebSocket test client."""
    from flask_socketio import SocketIOTestClient
    from app.extensions import socketio

    access_token = create_access_token(identity=test_user.id)
    client = SocketIOTestClient(
        app,
        socketio,
        auth={'token': access_token}
    )
    return client
