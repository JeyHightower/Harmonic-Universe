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
    Storyboard
)
from sqlalchemy.orm import scoped_session, sessionmaker
from flask_jwt_extended import create_access_token
import time
from .config import TestConfig

@pytest.fixture(scope='session')
def app():
    """Create application for the tests."""
    _app = create_app(TestConfig)
    ctx = _app.test_request_context()
    ctx.push()

    yield _app

    ctx.pop()

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

@pytest.fixture(scope='function')
def test_user(session):
    """Create test user."""
    user = User(
        username='testuser',
        email='test@example.com'
    )
    user.set_password('Password123')
    session.add(user)
    session.commit()
    return user

@pytest.fixture(scope='function')
def auth_headers(app, test_user, session):
    """Create authentication headers."""
    with app.app_context():
        # Ensure the user exists in the database
        if not User.query.get(test_user.id):
            session.add(test_user)
            session.commit()

        access_token = create_access_token(identity=test_user.id)
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        return headers

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
