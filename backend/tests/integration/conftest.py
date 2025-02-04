import pytest
from typing import Dict, Generator
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from alembic import command
from alembic.config import Config
import os

from app.core.config import settings
from app.db.session import SessionLocal, engine, init_db
from app.db.base import Base
from app.main import app
from tests.utils.user import create_random_user
from tests.utils.universe import create_random_universe
from tests.utils.scene import create_random_scene

# Import all models to ensure they are registered with SQLAlchemy
from app.models.core.user import User
from app.models.core.universe import Universe
from app.models.core.scene import Scene
from app.models.audio.audio_file import AudioFile
from app.models.ai.ai_model import AIModel
from app.models.ai.ai_generation import AIGeneration
from app.models.organization.storyboard import Storyboard
from app.models.organization.timeline import Timeline
from app.models.physics.physics_parameter import PhysicsParameter
from app.models.physics.physics_constraint import PhysicsConstraint
from app.models.physics.physics_object import PhysicsObject
from app.models.audio.music_parameter import MusicParameter
from app.models.audio.midi_event import MidiEvent
from app.models.metrics import PerformanceMetrics
from app.models.visualization.visualization import Visualization
from app.models.visualization.keyframe import Keyframe
from app.models.export import Export

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Create tables in test database before running tests."""
    # Close any existing connections
    engine.dispose()

    # For SQLite, remove the database file if it exists
    if str(settings.SQLALCHEMY_DATABASE_URI).startswith('sqlite'):
        db_path = settings.SQLALCHEMY_DATABASE_URI.replace('sqlite:///', '')
        if os.path.exists(db_path):
            os.remove(db_path)

    # Create all tables directly without migrations for testing
    Base.metadata.create_all(bind=engine)

    yield

    # Cleanup after tests
    Base.metadata.drop_all(bind=engine)
    engine.dispose()

@pytest.fixture(scope="function")
def db() -> Session:
    """Get test database session."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()

@pytest.fixture(scope="function")
def test_db(db: Session):
    """Create a fresh database for each test."""
    # Clear all tables
    for table in reversed(Base.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()

    yield db

    # Cleanup after test
    for table in reversed(Base.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()

@pytest.fixture(scope="module")
def client() -> Generator:
    """Create a test client for the FastAPI app."""
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="module")
def superuser_token_headers(client: TestClient, db: Session) -> Dict[str, str]:
    """Return a valid token for the superuser."""
    superuser = create_random_user(db)
    auth_token = "test-superuser-token"  # In a real app, generate this properly
    return {"Authorization": f"Bearer {auth_token}"}

@pytest.fixture(autouse=True)
def setup_and_teardown(db: Session):
    """Perform any setup before each test and cleanup after."""
    # Start with a clean slate for each test
    db.begin_nested()
    yield
    # Cleanup: rollback any changes made during the test
    db.rollback()
    db.close()

@pytest.fixture
def test_user(db: Session) -> Dict:
    """Create a test user with associated universe and scene."""
    # Create user
    user_dict = create_random_user(db)
    user = user_dict["user"]

    # Create universe
    universe = create_random_universe(db)

    # Create scene
    scene = create_random_scene(db, universe.id)

    # Update user's active scene
    user.active_scene_id = scene.id
    db.commit()

    return {
        "user": user,
        "universe_id": universe.id,
        "active_scene_id": scene.id
    }
