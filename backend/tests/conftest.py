"""Global test configuration and fixtures."""

import pytest
from typing import Dict, Generator, Any
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient
import asyncio
from datetime import datetime
import logging
from pathlib import Path
import os
import sys
from sqlalchemy import inspect

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Add backend directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.db.session import SessionLocal, engine, init_db
from app.db.base import Base
from app.core.config.test_settings import TestSettings
from app.core.security import create_access_token, get_password_hash
from app.models.core.user import User
from app.models.core.universe import Universe
from app.models.core.scene import Scene
from app.api.deps import get_db
from tests.utils.override_get_db import override_get_db

# Import all fixtures
from tests.fixtures import *

# Initialize test settings
test_settings = TestSettings()

def verify_tables_exist():
    """Verify that all required tables exist in the database."""
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    logger.debug(f"Existing tables: {existing_tables}")

    required_tables = [
        'users', 'universes', 'scenes', 'audio_files', 'ai_models',
        'ai_generations', 'storyboards', 'timelines', 'music_parameters',
        'midi_events', 'performance_metrics', 'physics_parameters',
        'visualizations', 'keyframes', 'exports', 'physics_constraints',
        'physics_objects', 'scene_objects'
    ]
    for table in required_tables:
        if table not in existing_tables:
            raise Exception(f"Required table '{table}' does not exist in the database")
        logger.debug(f"Verified table '{table}' exists")

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Set up test environment."""
    logger.info("Setting up test environment")

    # Set environment variables
    os.environ["TESTING"] = "1"
    os.environ["DATABASE_URL"] = test_settings.DATABASE_URI
    os.environ["SQLALCHEMY_DATABASE_URI"] = test_settings.DATABASE_URI

    # Get absolute paths
    db_dir = os.path.abspath(test_settings.DB_DIR)
    db_file = os.path.abspath(test_settings.DB_FILE)
    logger.debug(f"Database directory: {db_dir}")
    logger.debug(f"Database file: {db_file}")

    # Ensure test database directory exists
    Path(db_dir).mkdir(parents=True, exist_ok=True)

    # Remove existing database file if it exists
    db_path = Path(db_file)
    if db_path.exists():
        logger.debug(f"Removing existing database file: {db_file}")
        db_path.unlink()

    logger.info("Creating database tables")
    # Initialize database with all models
    init_db()

    # Verify tables were created
    verify_tables_exist()
    logger.info("Database tables created and verified successfully")

    yield

    logger.info("Cleaning up test environment")
    # Clean up test files
    for dir_path in [test_settings.UPLOAD_DIR, test_settings.TEST_REPORTS_DIR]:
        path = Path(dir_path)
        if path.exists():
            for file in path.glob("*"):
                file.unlink()

    # Close all connections
    engine.dispose()

    # Remove test database file
    if db_path.exists():
        db_path.unlink()

@pytest.fixture(scope="function")
def db() -> Generator:
    """Get test database session."""
    connection = engine.connect()
    transaction = connection.begin()
    session = SessionLocal(bind=connection)

    logger.debug("Created new test database session")

    yield session

    logger.debug("Cleaning up test database session")
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db: Session) -> Generator:
    """Create test client with database session."""
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides = {}

@pytest.fixture(scope="function")
def test_user(db: Session) -> Dict[str, Any]:
    """Create test user."""
    user = UserFactory.create(db=db)
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "obj": user
    }

@pytest.fixture(scope="function")
def test_universe(db: Session, test_user: Dict) -> Dict[str, Any]:
    """Create test universe."""
    universe = UniverseFactory.create(db=db, creator_id=test_user["id"])
    return {
        "id": universe.id,
        "name": universe.name,
        "description": universe.description,
        "obj": universe
    }

@pytest.fixture(scope="function")
def test_scene(db: Session, test_universe: Dict) -> Dict[str, Any]:
    """Create test scene."""
    scene = SceneFactory.create(db=db, universe_id=test_universe["id"])
    return {
        "id": scene.id,
        "name": scene.name,
        "description": scene.description,
        "obj": scene
    }

@pytest.fixture(scope="function")
def auth_headers(test_user: Dict) -> Dict[str, str]:
    """Create authorization headers."""
    access_token = create_access_token(test_user["id"])
    return {"Authorization": f"Bearer {access_token}"}

@pytest.fixture(scope="function")
def superuser(db: Session) -> User:
    """Create superuser."""
    user = UserFactory.create(
        db=db,
        is_superuser=True,
        email=test_settings.FIRST_SUPERUSER_EMAIL
    )
    return user

@pytest.fixture(scope="function")
def superuser_headers(superuser: User) -> Dict[str, str]:
    """Create superuser authorization headers."""
    access_token = create_access_token(superuser.id)
    return {"Authorization": f"Bearer {access_token}"}

# Add more fixtures as needed for specific test categories
