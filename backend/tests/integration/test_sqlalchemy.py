"""
SQLAlchemy test configuration and basic tests.
"""

import pytest
from flask import Flask
from backend.app.extensions import db, init_extensions
from backend.app.models.scene import Scene, RenderingMode
from backend.app.config import settings

def create_test_app():
    """Create a Flask app for testing."""
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    init_extensions(app)
    return app

def test_database_operations():
    """Test basic database operations."""
    app = create_test_app()

    with app.app_context():
        # Create all tables
        db.create_all()

        try:
            # Create a test scene
            test_scene = Scene(
                name="Test Scene",
                description="A test scene",
                rendering_mode=RenderingMode.SOLID
            )
            db.session.add(test_scene)
            db.session.commit()

            # Query the scene
            scene = db.session.query(Scene).filter(Scene.name == "Test Scene").first()
            assert scene is not None
            assert scene.name == "Test Scene"
            assert scene.rendering_mode == RenderingMode.SOLID

            print("✅ SQLAlchemy operations successful!")

        except Exception as e:
            print(f"❌ SQLAlchemy operations failed: {str(e)}")
            raise

        finally:
            db.session.close()

        # Clean up - drop tables
        db.drop_all()

if __name__ == "__main__":
    test_database_operations()
