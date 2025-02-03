"""Test configuration and fixtures."""

import os
import sys
import pytest
from typing import Dict, Generator, AsyncGenerator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, inspect
from sqlalchemy.orm import sessionmaker, Session, scoped_session
from sqlalchemy.pool import StaticPool
from datetime import datetime, timedelta
import logging
from pathlib import Path
from jose import jwt
import asyncio
import contextlib
import platform
from fastapi import HTTPException, FastAPI
import alembic.config
import alembic.command
from flask import Flask
from flask.testing import FlaskClient

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add the project root directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Add the backend directory to the Python path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(backend_dir)

from app.db.base_model import Base
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash
from app.core.test_config import TestSettings
from app.test_config import test_settings
from app.db.init_db import init_db, verify_database_connection
from app import create_app
from app.extensions import db, init_extensions

# Import all models to ensure they're registered with SQLAlchemy
from app.models import (
    User, AIModel, Universe, Scene, PhysicsParameter, MusicParameter,
    Timeline, Keyframe, Visualization, Export, AIGeneration, AudioFile,
    Storyboard, MidiEvent, PhysicsObject, PhysicsConstraint
)

# Test directories
TEST_UPLOAD_DIR = Path("tests/uploads")
TEST_FIXTURES_DIR = Path("tests/fixtures")

@pytest.fixture(scope="session")
def test_app():
    """Create Flask test application."""
    app = Flask(__name__)
    app.config.update({
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'TESTING': True,
        'CORS_ORIGINS': '*',  # Allow all origins in test
        'SQLALCHEMY_ECHO': True  # Enable SQL logging
    })

    # Initialize extensions
    init_extensions(app)

    # Create tables in app context
    with app.app_context():
        # Import all models to ensure they're registered
        from app.models import (
            User, AIModel, Universe, Scene, PhysicsParameter, MusicParameter,
            Timeline, Keyframe, Visualization, Export, AIGeneration, AudioFile,
            Storyboard, MidiEvent, PhysicsObject, PhysicsConstraint
        )
        db.create_all()

    return app

@pytest.fixture(scope="session")
def engine(test_app):
    """Create the test database engine."""
    logger.info("Creating test database engine")

    with test_app.app_context():
        # Create engine
        yield db.engine

        # Clean up is handled by db_session fixture
        logger.info("Test database engine cleanup complete")

@pytest.fixture(scope="function")
def db_session(test_app):
    """Create a new database session for a test."""
    logger.info("Creating new database session")

    with test_app.app_context():
        # Start a transaction
        connection = db.engine.connect()
        transaction = connection.begin()

        # Create a session bound to the connection
        session = db.create_scoped_session(
            options={"bind": connection, "binds": {}}
        )

        # Make the session available to the app
        db.session = session

        yield session

        # Clean up
        logger.info("Cleaning up database session")
        session.close()
        transaction.rollback()
        connection.close()

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Set up test environment."""
    logger.info("Setting up test environment")

    # Create test directories
    TEST_UPLOAD_DIR.mkdir(exist_ok=True, parents=True)
    TEST_FIXTURES_DIR.mkdir(exist_ok=True, parents=True)
    logger.info(f"Created test upload directory at {TEST_UPLOAD_DIR}")

    yield

    # Cleanup
    logger.info("Cleaning up test environment")
    if TEST_UPLOAD_DIR.exists():
        for file in TEST_UPLOAD_DIR.glob("*"):
            file.unlink()
    if TEST_FIXTURES_DIR.exists():
        for file in TEST_FIXTURES_DIR.glob("*"):
            file.unlink()

@pytest.fixture
def client(test_app):
    """Create a test client."""
    return test_app.test_client()

@pytest.fixture
def test_user(test_app, db_session):
    """Create a test user."""
    with test_app.app_context():
        user = User(
            email="test@example.com",
            username="testuser",
            full_name="Test User",
            is_active=True,
            is_superuser=False,
            email_verified=True,
            hashed_password=get_password_hash("test-password")
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

@pytest.fixture
def test_superuser(test_app, db_session):
    """Create a test superuser."""
    with test_app.app_context():
        user = User(
            email="admin@example.com",
            username="admin",
            full_name="Admin User",
            is_active=True,
            is_superuser=True,
            email_verified=True,
            hashed_password=get_password_hash("admin-password")
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

@pytest.fixture
def test_universe(test_app, db_session: Session, test_user: User) -> Universe:
    """Create a test universe."""
    with test_app.app_context():
        universe = Universe(
            name="Test Universe",
            description="A test universe",
            physics_json={},
            music_parameters={},
            creator_id=test_user.id
        )
        db_session.add(universe)
        db_session.commit()
        db_session.refresh(universe)
        return universe

@pytest.fixture
def auth_headers(test_user: User) -> Dict[str, str]:
    """Create authentication headers."""
    access_token = create_access_token(test_user.id)
    return {"Authorization": f"Bearer {access_token}"}
