"""Test configuration and fixtures for backend tests."""
import os
import pytest
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from app import create_app
from app.extensions import db as _db, socketio
from app.models import (
    User, Universe, Comment, Favorite, Storyboard,
    Version, Template, MusicParameters, VisualizationParameters,
    AudioParameters, PhysicsParameters
)
from sqlalchemy.orm import scoped_session, sessionmaker
from flask_jwt_extended import create_access_token
import time
import json

# Test configuration
TEST_CONFIG = {
    'TESTING': True,
    'DEBUG': True,
    'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
    'SQLALCHEMY_TRACK_MODIFICATIONS': False,
    'JWT_SECRET_KEY': 'test-jwt-secret',
    'SECRET_KEY': 'test-secret',
    'PRESERVE_CONTEXT_ON_EXCEPTION': False,
    'SOCKETIO_MESSAGE_QUEUE': None,
    'WTF_CSRF_ENABLED': False,
    'UPLOAD_FOLDER': 'test_uploads',
    'MAX_CONTENT_LENGTH': 16 * 1024 * 1024,  # 16MB
    'RATELIMIT_ENABLED': False
}

@pytest.fixture(scope='session')
def app():
    """Create test application."""
    app = create_app('testing')
    app.config.update(TEST_CONFIG)

    return app

@pytest.fixture(scope='session')
def db(app):
    """Create test database."""
    with app.app_context():
        _db.create_all()
        yield _db
        _db.session.remove()
        _db.drop_all()

@pytest.fixture(scope='function')
def session(db):
    """Create new database session for a test."""
    connection = db.engine.connect()
    transaction = connection.begin()

    session = scoped_session(
        sessionmaker(bind=connection, binds={})
    )
    db.session = session

    yield session

    transaction.rollback()
    connection.close()
    session.remove()

@pytest.fixture(scope='function')
def client(app):
    """Create test client."""
    return app.test_client()

@pytest.fixture(scope='function')
def auth_headers():
    """Create authentication headers."""
    def _auth_headers(user_id=1):
        access_token = create_access_token(identity=user_id)
        return {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
    return _auth_headers

@pytest.fixture(scope='function')
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

@pytest.fixture(scope='function')
def test_universe(session, test_user):
    """Create test universe."""
    universe = Universe(
        name='Test Universe',
        description='Test Description',
        user_id=test_user.id,
        physics_parameters=PhysicsParameters(),
        music_parameters=MusicParameters(),
        visualization_parameters=VisualizationParameters(),
        audio_parameters=AudioParameters()
    )
    session.add(universe)
    session.commit()
    return universe

@pytest.fixture(scope='function')
def socketio_client(app, client):
    """Create test socketio client."""
    return socketio.test_client(app, flask_test_client=client)

@pytest.fixture(scope='function')
def cleanup_uploads():
    """Clean up test uploads."""
    yield
    if os.path.exists('test_uploads'):
        for file in os.listdir('test_uploads'):
            os.remove(os.path.join('test_uploads', file))
        os.rmdir('test_uploads')

# Helper functions
def create_test_storyboard(session, universe_id, user_id):
    """Create a test storyboard."""
    storyboard = Storyboard(
        title='Test Storyboard',
        description='Test Description',
        universe_id=universe_id,
        user_id=user_id
    )
    session.add(storyboard)
    session.commit()
    return storyboard

def create_test_version(session, universe_id):
    """Create a test version."""
    version = Version(
        name='Test Version',
        description='Test Description',
        universe_id=universe_id,
        physics_parameters=PhysicsParameters(),
        music_parameters=MusicParameters(),
        visualization_parameters=VisualizationParameters(),
        audio_parameters=AudioParameters()
    )
    session.add(version)
    session.commit()
    return version
