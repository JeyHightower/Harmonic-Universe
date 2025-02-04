"""
Database session configuration.
"""

from typing import Generator, AsyncGenerator
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.pool import QueuePool
from app.core.config import settings
from app.db.base_class import Base

# Configure logging
logger = logging.getLogger(__name__)

def get_sync_db_url() -> str:
    """Get the synchronous database URL."""
    database_url = str(settings.SQLALCHEMY_DATABASE_URI)

    # Check if using SQLite
    is_sqlite = any(x in database_url.lower() for x in ['sqlite:', 'sqlite+pysqlite:', 'sqlite+aiosqlite:'])

    if is_sqlite:
        # Extract the database path from the URL
        if '///' in database_url:
            db_path = database_url.split('///')[1]
        else:
            db_path = database_url.split('sqlite:')[1]
        return f"sqlite+pysqlite:///{db_path}"
    else:
        # PostgreSQL or other database
        return database_url

def get_async_db_url() -> str:
    """Get the asynchronous database URL."""
    database_url = str(settings.SQLALCHEMY_DATABASE_URI)

    # Check if using SQLite
    is_sqlite = any(x in database_url.lower() for x in ['sqlite:', 'sqlite+pysqlite:', 'sqlite+aiosqlite:'])

    if is_sqlite:
        # Extract the database path from the URL
        if '///' in database_url:
            db_path = database_url.split('///')[1]
        else:
            db_path = database_url.split('sqlite:')[1]
        return f"sqlite+aiosqlite:///{db_path}"
    else:
        # PostgreSQL or other database
        return database_url.replace('postgresql:', 'postgresql+asyncpg:')

# Create database engines
sync_url = get_sync_db_url()
async_url = get_async_db_url()

logger.debug(f"Sync Database URL: {sync_url}")
logger.debug(f"Async Database URL: {async_url}")

# SQLite configuration
if 'sqlite' in sync_url.lower():
    engine_args = {
        "connect_args": {"check_same_thread": False},
        "pool_pre_ping": True,
        "echo": settings.SQLALCHEMY_ECHO
    }
else:
    # PostgreSQL configuration
    engine_args = {
        "pool_pre_ping": True,
        "pool_size": settings.SQLALCHEMY_POOL_SIZE,
        "max_overflow": settings.SQLALCHEMY_MAX_OVERFLOW,
        "echo": settings.SQLALCHEMY_ECHO
    }

# Create engines
engine = create_engine(sync_url, **engine_args)

# Create session factories
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Create thread-safe session
db = scoped_session(SessionLocal)

def get_db() -> Generator[Session, None, None]:
    """Get database session."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def init_db() -> None:
    """Initialize database."""
    logger.debug("Initializing database and creating tables")

    # Import all models here to ensure they are registered
    from app.db.base_model import Base
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
    from app.models.visualization.visualization import Visualization
    from app.models.visualization.keyframe import Keyframe
    from app.models.export import Export
    from app.models.physics.physics_constraint import PhysicsConstraint
    from app.models.physics.physics_object import PhysicsObject
    from app.models.visualization.scene_object import SceneObject

    logger.debug("All models imported, creating tables")

    # Create all tables
    Base.metadata.create_all(bind=engine)

    logger.debug("Tables created successfully")

# For testing
def get_test_db() -> Generator[Session, None, None]:
    """Get test database session."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

__all__ = ['SessionLocal', 'engine', 'Base', 'get_db', 'get_test_db', 'init_db']
