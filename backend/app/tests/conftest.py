import pytest
from typing import Dict, Generator
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from alembic import command
from alembic.config import Config
import os

from app.core.config import settings
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.main import app
from app.tests.utils.user import create_random_user
from app.tests.utils.universe import create_random_universe
from app.tests.utils.scene import create_random_scene

# Import all models to ensure they are registered with SQLAlchemy
from app.models.user import User
from app.models.universe import Universe
from app.models.scene import Scene
from app.models.audio_file import AudioFile
from app.models.ai_model import AIModel
from app.models.ai_generation import AIGeneration
from app.models.storyboard import Storyboard
from app.models.timeline import Timeline
from app.models.music_parameter import MusicParameter
from app.models.midi_event import MidiEvent
from app.models.metrics import PerformanceMetrics
from app.models.physics_parameter import PhysicsParameter
from app.models.visualization import Visualization
from app.models.keyframe import Keyframe
from app.models.export import Export
from app.models.physics_constraint import PhysicsConstraint
from app.models.physics_object import PhysicsObject
from app.models.scene_object import SceneObject

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

    # Drop all tables first to ensure clean state
    Base.metadata.drop_all(bind=engine)

    # Run migrations
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")

    # Create a test session
    test_session = SessionLocal()

    try:
        yield test_session
    finally:
        test_session.close()
        # Don't drop tables after tests to preserve for debugging
        # Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db(setup_test_db) -> Generator:
    """Create a fresh database session for a test."""
    session = setup_test_db
    try:
        yield session
    finally:
        session.rollback()

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
