"""Test configuration and fixtures."""

import os
import sys
import pytest
from typing import Dict, Generator, AsyncGenerator
from datetime import datetime
import logging
from pathlib import Path
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add the project root directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.db.session import SessionLocal, engine, get_db
from app.db.base import Base
from app.core.config.test_settings import TestSettings
from app.core.security import create_access_token, get_password_hash
from app.models.core.user import User
from app.models.ai.ai_model import AIModel
from app.models.core.universe import Universe
from app.models.core.scene import Scene
from app.models.physics.physics_parameter import PhysicsParameter
from app.models.physics.physics_object import PhysicsObject
from app.models.physics.physics_constraint import PhysicsConstraint
from app.models.audio.music_parameter import MusicParameter
from app.models.audio.midi_event import MidiEvent
from app.models.audio.audio_file import AudioFile
from app.models.organization.timeline import Timeline
from app.models.visualization.keyframe import Keyframe
from app.models.visualization.visualization import Visualization
from app.models.organization.storyboard import Storyboard
from app.models.ai.ai_generation import AIGeneration

from tests.utils.factories import UserFactory, UniverseFactory, SceneFactory

# Use TestSettings instead of regular settings
test_settings = TestSettings()

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Set up test environment."""
    logger.info("Setting up test environment")

    # Set environment variables
    os.environ["TESTING"] = "1"
    os.environ["DATABASE_URL"] = test_settings.DATABASE_URI

    # Create test database tables
    Base.metadata.create_all(bind=engine)

    yield

    logger.info("Cleaning up test environment")
    # Clean up test files
    for dir_path in [test_settings.UPLOAD_DIR, test_settings.TEST_REPORTS_DIR]:
        path = Path(dir_path)
        if path.exists():
            for file in path.glob("*"):
                file.unlink()

    # Drop test database tables
    Base.metadata.drop_all(bind=engine)

    # Clean up environment
    os.environ.pop("TESTING", None)
    os.environ.pop("DATABASE_URL", None)

@pytest.fixture(scope="session")
def db() -> Generator:
    """Database fixture that creates a new database session for a test."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="session")
def client() -> Generator:
    """FastAPI test client fixture."""
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture(scope="session")
def test_user(db: Session) -> Dict:
    """Create a test user."""
    user = UserFactory.create(db=db)
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username
    }

@pytest.fixture(scope="session")
def test_universe(db: Session, test_user: Dict) -> Dict:
    """Create a test universe."""
    universe = UniverseFactory.create(db=db, user_id=test_user["id"])
    return {
        "id": universe.id,
        "name": universe.name,
        "description": universe.description
    }

@pytest.fixture(scope="session")
def test_scene(db: Session, test_universe: Dict) -> Dict:
    """Create a test scene."""
    scene = SceneFactory.create(db=db, universe_id=test_universe["id"])
    return {
        "id": scene.id,
        "name": scene.name,
        "description": scene.description
    }

@pytest.fixture(scope="function")
def async_db() -> AsyncGenerator[AsyncSession, None]:
    """Create an async test database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="session")
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client."""
    async with AsyncClient(base_url="http://test") as test_client:
        yield test_client

@pytest.fixture
def test_superuser(db: Session) -> User:
    """Create a test superuser."""
    user = User(
        email=test_settings.TEST_USER_EMAIL,
        username="admin",
        hashed_password=get_password_hash(test_settings.TEST_USER_PASSWORD),
        is_superuser=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def test_user_token_headers(test_user: Dict) -> Dict[str, str]:
    """Create token headers for test user."""
    access_token = create_access_token(test_user["id"])
    return {"Authorization": f"Bearer {access_token}"}

@pytest.fixture
def test_superuser_token_headers(test_superuser: User) -> Dict[str, str]:
    """Create token headers for test superuser."""
    access_token = create_access_token(test_superuser.id)
    return {"Authorization": f"Bearer {access_token}"}
