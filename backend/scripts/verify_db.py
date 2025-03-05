"""
Database verification script.
"""
import sys
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from config import Config
from backend.app.extensions import db
from backend.app.models.scene import Scene, RenderingMode
from backend.app import create_app

def verify_database():
    """Verify database connection and models."""
    app = create_app()
    config = Config()

    with app.app_context():
        try:
            # Test database connection
            engine = create_engine(config.DATABASE_URL)
            connection = engine.connect()
            connection.close()
            print("✅ Database connection successful")

            # Verify models
            db.create_all()
            print("✅ Database models created successfully")

            # Test model creation
            test_scene = Scene(
                name="Test Scene",
                description="A test scene",
                rendering_mode=RenderingMode.SOLID
            )
            db.session.add(test_scene)
            db.session.commit()
            print("✅ Model operations successful")

            # Clean up
            db.session.delete(test_scene)
            db.session.commit()
            print("✅ Cleanup successful")

            return True

        except SQLAlchemyError as e:
            print(f"❌ Database error: {str(e)}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error: {str(e)}")
            return False

if __name__ == "__main__":
    success = verify_database()
    sys.exit(0 if success else 1)
