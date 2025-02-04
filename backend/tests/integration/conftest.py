import pytest
from typing import Dict, Generator, AsyncGenerator
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from alembic import command
from alembic.config import Config
import os
from datetime import timedelta
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.util._concurrency_py3k import greenlet_spawn

from app.core.config import settings
from app.db.session import SessionLocal, engine, async_engine
from app.db.base import Base
from app.main import app
from app.core.security import create_access_token
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
from app.models.audio.music_parameter import MusicParameter
from app.models.audio.midi_event import MidiEvent
from app.models.metrics import PerformanceMetrics
from app.models.physics.physics_parameter import PhysicsParameter
from app.models.visualization import Visualization
from app.models.visualization.keyframe import Keyframe
from app.models.export import Export
from app.models.physics.physics_constraint import PhysicsConstraint
from app.models.physics.physics_object import PhysicsObject
from app.models.visualization.scene_object import SceneObject

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
async def setup_test_db():
    """Create tables in test database before running tests."""
    # Close any existing connections
    await async_engine.dispose()

    # For SQLite, remove the database file if it exists
    if str(settings.SQLALCHEMY_DATABASE_URI).startswith('sqlite'):
        db_path = settings.SQLALCHEMY_DATABASE_URI.replace('sqlite:///', '')
        if os.path.exists(db_path):
            os.remove(db_path)

    def run_sync():
        # Drop all tables first to ensure clean state
        Base.metadata.drop_all(bind=engine)

        # Run migrations
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")

    await greenlet_spawn(run_sync)

    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

@pytest.fixture(scope="function")
async def db() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for a test."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.rollback()
            await session.close()

@pytest.fixture(scope="module")
def client() -> Generator:
    """Create a test client for the FastAPI app."""
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="module")
def test_client() -> Generator:
    """Create a test client specifically for WebSocket tests."""
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="module")
async def superuser_token_headers(client: TestClient, db: AsyncSession) -> Dict[str, str]:
    """Return a valid token for the superuser."""
    superuser = await create_random_user(db)
    auth_token = "test-superuser-token"  # In a real app, generate this properly
    return {"Authorization": f"Bearer {auth_token}"}

@pytest.fixture(scope="module")
async def auth_headers(client: TestClient, test_user: Dict) -> Dict[str, str]:
    """Return authentication headers for a test user."""
    auth_token = create_access_token(
        data={"sub": str(test_user["user"].id)},
        expires_delta=timedelta(minutes=30)
    )
    return {"Authorization": f"Bearer {auth_token}"}

@pytest.fixture(autouse=True)
async def setup_and_teardown(db: AsyncSession):
    """Perform any setup before each test and cleanup after."""
    # Start with a clean slate for each test
    async with db.begin():
        yield
    # Cleanup: rollback any changes made during the test
    await db.rollback()
    await db.close()

@pytest.fixture
async def test_user(db: AsyncSession) -> Dict:
    """Create a test user with associated universe and scene."""
    # Create user
    user_dict = await create_random_user(db)
    user = user_dict["user"]

    # Create universe
    universe = await create_random_universe(db)

    # Create scene
    scene = await create_random_scene(db, universe.id)

    # Update user's active scene
    user.active_scene_id = scene.id
    await db.commit()

    return {
        "user": user,
        "universe_id": universe.id,
        "active_scene_id": scene.id
    }

@pytest.fixture
async def test_audio(db: AsyncSession, test_user: Dict) -> AudioFile:
    """Create a test audio file."""
    audio = AudioFile(
        name="Test Audio",
        description="Test audio file",
        file_path="/test/path/audio.wav",
        duration=240,
        format="wav",
        sample_rate=48000,
        channels=2,
        file_size=1024 * 1024,  # 1MB
        user_id=test_user["user"].id,
        universe_id=test_user["universe_id"]
    )
    db.add(audio)
    await db.commit()
    await db.refresh(audio)
    return audio
