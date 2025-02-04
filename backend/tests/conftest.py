"""Test configuration and fixtures."""

import os
import sys
import pytest
from typing import Dict, Generator
from datetime import datetime
import logging
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add the project root directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.main import app
from backend.app.db.database import SessionLocal, engine
from backend.app.core.security import create_access_token, get_password_hash
from backend.app.db.base_model import Base

# Import all models to ensure they're registered with SQLAlchemy
from backend.app.models import (
    User, AIModel, Universe, Scene, PhysicsParameter, MusicParameter,
    Timeline, Keyframe, Visualization, Export, AIGeneration, AudioFile,
    Storyboard, MidiEvent, PhysicsObject, PhysicsConstraint
)

# Test directories
TEST_UPLOAD_DIR = Path("tests/uploads")
TEST_FIXTURES_DIR = Path("tests/fixtures")

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Set up test environment."""
    logger.info("Setting up test environment")

    TEST_UPLOAD_DIR.mkdir(exist_ok=True, parents=True)
    TEST_FIXTURES_DIR.mkdir(exist_ok=True, parents=True)
    logger.info(f"Created test upload directory at {TEST_UPLOAD_DIR}")

    # Create test database tables
    Base.metadata.create_all(bind=engine)

    yield

    logger.info("Cleaning up test environment")
    if TEST_UPLOAD_DIR.exists():
        for file in TEST_UPLOAD_DIR.glob("*"):
            file.unlink()
    if TEST_FIXTURES_DIR.exists():
        for file in TEST_FIXTURES_DIR.glob("*"):
            file.unlink()

    # Drop test database tables
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    """Create a new database session for a test."""
    logger.info("Creating new database session")
    session = SessionLocal()
    try:
        yield session
    finally:
        logger.info("Cleaning up database session")
        session.close()

@pytest.fixture(scope="function")
def client() -> Generator[TestClient, None, None]:
    """Create a test client."""
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture
def test_user(db: Session) -> User:
    """Create a test user."""
    user = User(
        email="test@example.com",
        username="testuser",
        full_name="Test User",
        is_active=True,
        is_superuser=False,
        email_verified=True,
        hashed_password=get_password_hash("test-password")
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def test_superuser(db: Session) -> User:
    """Create a test superuser."""
    user = User(
        email="admin@example.com",
        username="admin",
        full_name="Admin User",
        is_active=True,
        is_superuser=True,
        email_verified=True,
        hashed_password=get_password_hash("admin-password")
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def test_universe(db: Session, test_user: User) -> Universe:
    """Create a test universe."""
    universe = Universe(
        name="Test Universe",
        description="A test universe",
        physics_json={},
        music_parameters={},
        creator_id=test_user.id
    )
    db.add(universe)
    db.commit()
    db.refresh(universe)
    return universe

@pytest.fixture
def auth_headers(test_user: User) -> Dict[str, str]:
    """Create authentication headers."""
    access_token = create_access_token(test_user.id)
    return {"Authorization": f"Bearer {access_token}"}
