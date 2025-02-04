"""
SQLAlchemy test configuration and basic tests.
"""

import sys
import os

# Add the project root to the Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
sys.path.insert(0, project_root)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.main import app
from backend.app.models import (
    User, Universe, Scene, AIGeneration, AIModel, PhysicsParameter,
    MusicParameter, Timeline, Keyframe, Visualization, Export,
    AudioFile, Storyboard, MidiEvent, PhysicsObject, PhysicsConstraint
)
from backend.app.models.scene import RenderingMode
from backend.app.core.security import get_password_hash
from backend.app.db.base_model import Base
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Create test database engine
TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Create test SessionLocal
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def test_client():
    """Create test client."""
    return TestClient(app)

@pytest.fixture
def db_session():
    """Create database and tables."""
    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Create a new session for testing
    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()
        # Drop all tables
        Base.metadata.drop_all(bind=engine)

def test_database_operations(db_session, test_user):
    """Test basic database operations."""
    logger.info("Starting database operations test")

    try:
        # Create a test universe first
        test_universe = Universe(
            name="Test Universe",
            description="A test universe",
            physics_json={},
            music_parameters={},
            creator_id=test_user.id
        )
        db_session.add(test_universe)
        db_session.commit()

        # Create a test scene
        test_scene = Scene(
            name="Test Scene",
            description="A test scene",
            rendering_mode=RenderingMode.SOLID,
            creator_id=test_user.id,
            universe_id=test_universe.id
        )

        # Add and commit the scene
        logger.info("Adding test scene to database")
        db_session.add(test_scene)
        db_session.commit()

        # Query the scene back
        logger.info("Querying test scene from database")
        queried_scene = db_session.query(Scene).filter_by(name="Test Scene").first()

        # Verify the scene was created correctly
        assert queried_scene is not None
        assert queried_scene.name == "Test Scene"
        assert queried_scene.creator_id == test_user.id
        assert queried_scene.universe_id == test_universe.id

        logger.info("Database operations test completed successfully")

    except Exception as e:
        logger.error(f"Error in database operations test: {e}")
        raise

if __name__ == "__main__":
    pytest.main([__file__, '-v'])
