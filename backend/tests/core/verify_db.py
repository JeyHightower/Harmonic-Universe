"""
Database verification script.
"""
import os
import sys

# Set environment variables before importing any app modules
os.environ['TESTING'] = 'true'
os.environ['FLASK_ENV'] = 'testing'
os.environ['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'

from sqlalchemy import create_engine, text, event, inspect
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.pool import StaticPool
from backend.config import Config
from backend.app.extensions import db
from backend.app.models.scene import Scene, RenderingMode
from backend.app.models.user import User
from backend.app.models.universe import Universe
from backend.app import create_app
from backend.app.models.relationships import setup_relationships
from backend.app.db.base_model import Base, metadata

def verify_tables(inspector, expected_tables):
    """Verify that all expected tables exist."""
    actual_tables = inspector.get_table_names()
    missing_tables = set(expected_tables) - set(actual_tables)
    if missing_tables:
        print(f"❌ Missing tables: {missing_tables}")
        print(f"Actual tables: {actual_tables}")
        return False
    return True

def verify_database():
    """Verify database connection and models."""
    app = create_app()

    # Force SQLite for testing with proper engine configuration
    app.config.update({
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SQLALCHEMY_ENGINE_OPTIONS': {
            'connect_args': {'check_same_thread': False},
            'poolclass': StaticPool
        }
    })

    print(f"Environment: {app.config['ENV']}")
    print(f"Testing mode: {app.config['TESTING']}")
    print(f"Database URL: {app.config['SQLALCHEMY_DATABASE_URI']}")

    with app.app_context():
        try:
            # Set up relationships
            setup_relationships()

            # Test database connection
            connection = db.engine.connect()
            print("✅ Database connection successful")

            # Drop existing tables if in testing mode
            Base.metadata.drop_all(bind=db.engine)
            print("✅ Dropped existing tables")

            # Create tables in the correct order
            Base.metadata.create_all(bind=db.engine)

            # Verify tables were created
            inspector = inspect(db.engine)
            expected_tables = ['users', 'universes', 'scenes']
            if not verify_tables(inspector, expected_tables):
                return False
            print("✅ Database tables created successfully")

            # Create test user with minimal fields
            test_user = User(
                username="test_user",
                email="test@example.com",
                is_active=True,
                full_name="Test User",
                hashed_password="test_password_hash",  # Skip bcrypt for testing
                is_superuser=False,
                email_verified=True
            )
            db.session.add(test_user)
            db.session.flush()  # Flush to get the ID
            print("✅ Test user created")

            # Create test universe
            test_universe = Universe(
                name="Test Universe",
                description="A test universe",
                creator_id=test_user.id,
                physics_json={},
                music_parameters={},
                is_public=True,
                max_participants=10,
                collaborators_count=0
            )
            db.session.add(test_universe)
            db.session.flush()  # Flush to get the ID
            print("✅ Test universe created")

            # Create test scene
            test_scene = Scene(
                name="Test Scene",
                description="A test scene",
                rendering_mode=RenderingMode.SOLID,
                creator_id=test_user.id,
                universe_id=test_universe.id,
                settings={"test": True},
                data={"version": "1.0"}
            )
            print(f"Created test scene: {test_scene}")

            db.session.add(test_scene)
            print("Added test scene to session")

            # Commit all changes
            db.session.commit()
            print("✅ Test data created successfully")

            # Query and verify test data
            scene = db.session.query(Scene).filter_by(name="Test Scene").first()
            assert scene is not None
            assert scene.name == "Test Scene"
            assert scene.settings.get("test") is True
            assert scene.creator.username == "test_user"
            assert scene.universe.name == "Test Universe"
            print("✅ Data verification successful")

            # Clean up
            db.session.delete(scene)
            db.session.delete(test_universe)
            db.session.delete(test_user)
            db.session.commit()
            Base.metadata.drop_all(bind=db.engine)
            print("✅ Cleanup successful")

            connection.close()
            return True

        except SQLAlchemyError as e:
            print(f"❌ Database error: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            return False

if __name__ == "__main__":
    success = verify_database()
    sys.exit(0 if success else 1)
