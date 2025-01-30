import os
import sys
import pytest
import eventlet
eventlet.monkey_patch()

# Add the project root directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models.user import User
from app.models.universe import Universe
from app.models.storyboard import Storyboard
import jwt
from datetime import datetime, timedelta
from flask_socketio import SocketIO, SocketIOTestClient
from flask_jwt_extended import create_access_token
from app.extensions import socketio
import threading
from collections import deque
import traceback
from sqlalchemy.orm import scoped_session, sessionmaker

@pytest.fixture(scope='session')
def app():
    """Create application for the tests."""
    os.environ['FLASK_ENV'] = 'testing'
    app = create_app('testing')

    # Setup app context
    ctx = app.app_context()
    ctx.push()

    yield app

    ctx.pop()

@pytest.fixture(scope='session')
def db(app):
    """Create database for the tests."""
    db.app = app
    db.create_all()

    yield db

    db.drop_all()

@pytest.fixture(scope='function')
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
    """Create a test client for the app."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """Create a test runner for the app's Click commands."""
    return app.test_cli_runner()

@pytest.fixture
def test_user(session):
    """Create a test user."""
    user = User(
        username='testuser',
        email='test@example.com'
    )
    user.set_password('password')
    session.add(user)
    session.commit()
    return user

@pytest.fixture
def test_universe(test_user, session):
    """Create a test universe."""
    universe = Universe(
        name='Test Universe',
        description='Test Description',
        user_id=test_user.id,
        is_public=False,
        allow_guests=False,
        music_parameters={},
        visual_parameters={}
    )
    session.add(universe)
    session.commit()
    return universe

@pytest.fixture
def auth_headers(test_user):
    """Create authentication headers for test user."""
    token = create_access_token(identity=str(test_user.id))
    return {'Authorization': f'Bearer {token}'}
