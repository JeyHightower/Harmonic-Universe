"""
SQLAlchemy test configuration and basic tests.
"""

import pytest
from flask import Flask
from app.extensions import db, init_extensions
from app.models import (
    User, Universe, Scene, AIGeneration, AIModel,
    PhysicsParameter, MusicParameter, Timeline, Keyframe,
    Visualization, Export, AudioFile, Storyboard, MidiEvent,
    PhysicsObject, PhysicsConstraint
)
from app.models.scene import RenderingMode
from app.core.security import get_password_hash
from app.db.base_model import Base
import logging

# Configure logging
logger = logging.getLogger(__name__)

def create_test_app():
    """Create a Flask app for testing."""
    app = Flask(__name__)
    app.config.update({
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'TESTING': True,
        'CORS_ORIGINS': '*'  # Allow all origins in test
    })

    # Initialize extensions
    init_extensions(app)

    return app

@pytest.fixture
def app():
    """Create application for the tests."""
    _app = create_test_app()
    return _app

@pytest.fixture
def client(app):
    """Create a test client."""
    return app.test_client()

@pytest.fixture
def db_session(app):
    """Create database and tables."""
    with app.app_context():
        # Create all tables at once to respect foreign key dependencies
        Base.metadata.create_all(bind=db.engine)

        yield db.session

        # Drop all tables at once
        Base.metadata.drop_all(bind=db.engine)

        db.session.remove()

def test_database_operations(app, db_session, test_user):
    """Test basic database operations."""
    logger.info("Starting database operations test")

    with app.app_context():
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
