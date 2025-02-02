import os
import sys
import pytest
from pathlib import Path

# Add the project root directory to the Python path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, PROJECT_ROOT)

from app.main import app
from app.core.config import settings

@pytest.fixture
def test_app():
    """Create a test app with test configuration."""
    app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': "sqlite:///:memory:",
        'WTF_CSRF_ENABLED': False
    })
    return app

def test_config(test_app):
    """Test configuration settings."""
    with test_app.app_context():
        assert test_app.config['TESTING']
        assert test_app.config['SQLALCHEMY_DATABASE_URI'] == "sqlite:///:memory:"
        assert test_app.config['WTF_CSRF_ENABLED'] is False

def test_config_values():
    """Test that configuration values are set correctly."""
    assert settings.PROJECT_NAME == "Harmonic Universe"
    assert settings.API_V1_STR == "/api"
    assert settings.SECRET_KEY is not None
    assert settings.ACCESS_TOKEN_EXPIRE_MINUTES > 0

def test_database_settings():
    """Test database configuration."""
    assert settings.DATABASE_URI is not None
    assert "postgresql" in settings.DATABASE_URI or "sqlite" in settings.DATABASE_URI

def test_table_creation_order():
    """Test that tables are created in the correct dependency order."""
    from app.db.base_class import Base

    # Get sorted tables
    sorted_tables = Base.metadata.sorted_tables
    table_names = [table.name for table in sorted_tables]

    # Verify core tables are in correct order
    assert "users" in table_names
    assert table_names.index("users") < table_names.index("universes")
    assert table_names.index("universes") < table_names.index("scene")

def test_database_relationships():
    """Test database relationship configurations."""
    from app.models.user import User
    from app.models.universe import Universe
    from app.models.scene import Scene

    # Verify User relationships
    assert hasattr(User, 'universes')
    assert hasattr(User, 'scenes')

    # Verify Universe relationships
    assert hasattr(Universe, 'creator')
    assert hasattr(Universe, 'scenes')

    # Verify Scene relationships
    assert hasattr(Scene, 'creator')
    assert hasattr(Scene, 'universe')

def test_cors_settings():
    """Test CORS configuration."""
    assert settings.BACKEND_CORS_ORIGINS is not None
    assert isinstance(settings.BACKEND_CORS_ORIGINS, list)
    assert all(isinstance(origin, str) for origin in settings.BACKEND_CORS_ORIGINS)

def test_security_settings():
    """Test security configuration."""
    assert settings.SECRET_KEY is not None
    assert len(settings.SECRET_KEY) >= 32
    assert settings.ALGORITHM == "HS256"
    assert settings.ACCESS_TOKEN_EXPIRE_MINUTES >= 30

def test_upload_settings():
    """Test file upload configuration."""
    assert settings.UPLOAD_DIR is not None
    assert isinstance(settings.UPLOAD_DIR, Path)
    assert settings.MAX_UPLOAD_SIZE > 0

def test_audio_settings():
    """Test audio processing configuration."""
    assert settings.ALLOWED_AUDIO_TYPES is not None
    assert isinstance(settings.ALLOWED_AUDIO_TYPES, list)
    assert all(isinstance(ext, str) for ext in settings.ALLOWED_AUDIO_TYPES)

def test_environment_settings():
    """Test environment-specific settings."""
    assert settings.DEBUG in (True, False)
    assert settings.ENVIRONMENT in ("development", "production", "test")

def test_email_settings():
    """Test email configuration."""
    assert settings.SMTP_HOST is not None
    assert settings.SMTP_PORT > 0
    assert settings.EMAILS_FROM_EMAIL is not None
    assert "@" in settings.EMAILS_FROM_EMAIL

def test_redis_settings():
    """Test Redis configuration."""
    assert settings.REDIS_HOST is not None
    assert settings.REDIS_PORT > 0

def test_websocket_settings():
    """Test WebSocket configuration."""
    assert settings.WS_MESSAGE_QUEUE_SIZE > 0
    assert settings.WS_HEARTBEAT_INTERVAL > 0

def test_model_primary_keys():
    """Test that all models have properly configured primary keys."""
    from app.models.user import User
    from app.models.universe import Universe
    from app.models.scene import Scene
    from sqlalchemy import inspect

    # Test User model
    user_inspector = inspect(User)
    user_pk = user_inspector.primary_key[0]
    assert user_pk.name == 'id'
    assert user_pk.type.__class__.__name__ == 'GUID'

    # Test Universe model
    universe_inspector = inspect(Universe)
    universe_pk = universe_inspector.primary_key[0]
    assert universe_pk.name == 'id'
    assert universe_pk.type.__class__.__name__ == 'GUID'

    # Test Scene model
    scene_inspector = inspect(Scene)
    scene_pk = scene_inspector.primary_key[0]
    assert scene_pk.name == 'id'
    assert scene_pk.type.__class__.__name__ == 'GUID'

def test_table_creation_and_constraints():
    """Test table creation and constraint configuration."""
    from app.db.base_class import Base
    from sqlalchemy import create_engine, inspect
    from sqlalchemy.pool import StaticPool

    # Create in-memory database for testing
    engine = create_engine(
        "sqlite:///:memory:",
        poolclass=StaticPool,
        connect_args={"check_same_thread": False}
    )

    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Get inspector
    inspector = inspect(engine)

    # Verify users table
    assert "users" in inspector.get_table_names()
    users_pk = inspector.get_pk_constraint("users")
    assert users_pk["constrained_columns"] == ["id"]

    # Verify foreign keys
    universe_fks = inspector.get_foreign_keys("universes")
    assert any(fk["referred_table"] == "users" for fk in universe_fks)

    scene_fks = inspector.get_foreign_keys("scene")
    assert any(fk["referred_table"] == "users" for fk in scene_fks)
    assert any(fk["referred_table"] == "universes" for fk in scene_fks)
