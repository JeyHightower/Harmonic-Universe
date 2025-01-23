"""Test configuration and fixtures."""
import os
import sys
import pytest
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from app import create_app
from app.extensions import db as _db
from app.models import (
    User,
    Universe,
    PhysicsParameters,
    MusicParameters,
    VisualizationParameters,
    Comment,
    Favorite,
    Storyboard,
    Parameter
)
from sqlalchemy.orm import scoped_session, sessionmaker
from flask_jwt_extended import create_access_token
import time
from .config import TestConfig

@pytest.fixture
def app():
    """Create application for testing."""
    app = create_app('testing')
    return app

@pytest.fixture(scope='session')
def db(app):
    """Create database for the tests."""
    # Drop all tables first to ensure clean state
    _db.drop_all()

    # Create all tables
    _db.create_all()

    yield _db

    # Clean up after tests
    _db.session.remove()
    _db.drop_all()

@pytest.fixture(scope='function')
def session(db):
    """Create a new database session for a test."""
    connection = db.engine.connect()
    transaction = connection.begin()

    # Create session factory
    session_factory = sessionmaker(bind=connection)
    session = scoped_session(session_factory)

    # Set session for SQLAlchemy
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
def runner(app):
    """Create test CLI runner."""
    return app.test_cli_runner()

@pytest.fixture
def test_user(app):
    """Create test user."""
    with app.app_context():
        user = User(
            username='testuser',
            email='test@example.com'
        )
        user.set_password('password123')
        _db.session.add(user)
        _db.session.commit()
        return user

@pytest.fixture
def auth_headers(client):
    """Create authentication headers."""
    response = client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'password123'
    })
    token = response.json['token']
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def mock_redis(mocker):
    """Mock Redis client."""
    mock = mocker.patch('app.extensions.redis')
    return mock

@pytest.fixture
def mock_websocket(mocker):
    """Mock WebSocket connection."""
    mock = mocker.patch('app.sockets.connection.Connection')
    return mock

@pytest.fixture
def test_universe(app, test_user):
    """Create test universe."""
    with app.app_context():
        universe = Universe(
            name='Test Universe',
            description='A test universe',
            is_public=True,
            creator=test_user
        )
        _db.session.add(universe)

        physics_params = Parameter(
            universe=universe,
            type='physics',
            data={'gravity': 9.81, 'particle_speed': 1.0}
        )
        _db.session.add(physics_params)

        _db.session.commit()
        return universe

@pytest.fixture
def socket_client(app):
    """Create WebSocket test client."""
    from flask_socketio import SocketIOTestClient
    from app.extensions import socketio
    return SocketIOTestClient(app, socketio)

@pytest.fixture(autouse=True)
def setup_database(app):
    """Set up test database before each test."""
    with app.app_context():
        _db.create_all()
        yield
        _db.session.remove()
        _db.drop_all()
