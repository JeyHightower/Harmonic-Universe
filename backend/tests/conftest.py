"""Test configuration and fixtures."""
import os
import sys
import pytest
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from app import create_app
from app.extensions import db
from app.models import Universe, PhysicsParameters
from sqlalchemy.orm import scoped_session, sessionmaker
from flask_jwt_extended import create_access_token
import time

# Import all models to ensure they're registered
from app.models.user import User
from app.models.universe import Universe
from app.models.comment import Comment
from app.models.favorite import Favorite
from app.models.storyboard import Storyboard
from app.models.version import Version
from app.models.template import Template
from app.models.music_parameters import MusicParameters
from app.models.visualization_parameters import VisualizationParameters
from app.models.audio_parameters import AudioParameters

@pytest.fixture(scope='session')
def app():
    """Create application for the tests."""
    app = create_app('testing')

    with app.app_context():
        db.create_all()

    yield app

    with app.app_context():
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()

@pytest.fixture
def session(app):
    """Create a new database session for a test."""
    with app.app_context():
        connection = db.engine.connect()
        transaction = connection.begin()

        # Create a session with the connection
        Session = sessionmaker(bind=connection)
        session = scoped_session(Session)
        db.session = session

        yield session

        session.close()
        transaction.rollback()
        connection.close()

@pytest.fixture
def runner(app):
    """Create a test CLI runner."""
    return app.test_cli_runner()

@pytest.fixture(scope='function')
def test_user(session):
    """Create test user."""
    user = User(username='testuser', email='test@example.com')
    user.set_password('password123')
    session.add(user)
    session.commit()
    return user

@pytest.fixture(scope='function')
def auth_headers(app, test_user):
    """Create authentication headers."""
    with app.app_context():
        access_token = create_access_token(identity=test_user.id)
        return {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
