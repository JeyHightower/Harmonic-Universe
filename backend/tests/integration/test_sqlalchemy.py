"""
SQLAlchemy test configuration and basic tests.
"""

import pytest
import logging
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.db.session import SessionLocal, engine, init_db
from app.models.core.scene import Scene
from app.core.config.test_settings import TestSettings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@pytest.fixture(scope="function")
def test_db():
    """Create a fresh database for each test."""
    settings = TestSettings()
    try:
        # Initialize database
        init_db()
        # Create a new session
        session = SessionLocal()
        yield session
    except Exception as e:
        logger.error(f"Error setting up test database: {str(e)}")
        raise
    finally:
        if 'session' in locals():
            session.close()

def test_database_operations(test_db: Session):
    """Test basic database operations."""
    try:
        # Create
        scene = Scene(
            name="Test Scene",
            description="A test scene",
            universe_id=None,
            creator_id=None
        )
        test_db.add(scene)
        test_db.commit()
        test_db.refresh(scene)

        # Verify creation
        assert scene.id is not None
        logger.info(f"Created scene with ID: {scene.id}")

        # Read
        retrieved_scene = test_db.query(Scene).filter(Scene.id == scene.id).first()
        assert retrieved_scene is not None
        assert retrieved_scene.name == "Test Scene"
        logger.info("Successfully retrieved scene")

        # Update
        retrieved_scene.name = "Updated Scene"
        test_db.commit()
        test_db.refresh(retrieved_scene)
        assert retrieved_scene.name == "Updated Scene"
        logger.info("Successfully updated scene")

        # Delete
        test_db.delete(retrieved_scene)
        test_db.commit()
        deleted_scene = test_db.query(Scene).filter(Scene.id == scene.id).first()
        assert deleted_scene is None
        logger.info("Successfully deleted scene")

    except SQLAlchemyError as e:
        logger.error(f"Database operation failed: {str(e)}")
        test_db.rollback()
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        test_db.rollback()
        raise

def test_database_constraints(test_db: Session):
    """Test database constraints and validations."""
    try:
        # Test required fields
        scene = Scene()  # Missing required fields
        test_db.add(scene)
        with pytest.raises(SQLAlchemyError):
            test_db.commit()
        test_db.rollback()
        logger.info("Successfully tested required field constraints")

    except Exception as e:
        logger.error(f"Constraint test failed: {str(e)}")
        test_db.rollback()
        raise

if __name__ == "__main__":
    pytest.main([__file__])
