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

# Create database engines
database_url = str(settings.SQLALCHEMY_DATABASE_URI)
logger.debug(f"Database URL: {database_url}")

# Check if using SQLite (with or without driver)
is_sqlite = any(x in database_url.lower() for x in ['sqlite:', 'sqlite+pysqlite:', 'sqlite+aiosqlite:'])

if is_sqlite:
    # SQLite configuration
    # Extract the database path from the URL
    if '///' in database_url:
        db_path = database_url.split('///')[1]
    else:
        db_path = database_url.split('sqlite:')[1]

    # Create proper URLs with correct drivers
    sync_url = f"sqlite+pysqlite:///{db_path}"
    async_url = f"sqlite+aiosqlite:///{db_path}"

    logger.debug(f"Using SQLite - Sync URL: {sync_url}, Async URL: {async_url}")

    sqlite_args = {
        "connect_args": {"check_same_thread": False},
        "pool_pre_ping": True,
        "echo": False
    }

    engine = create_engine(sync_url, **sqlite_args)
    async_engine = create_async_engine(async_url, **sqlite_args)
else:
    # PostgreSQL configuration
    sync_url = database_url
    async_url = database_url.replace('postgresql:', 'postgresql+asyncpg:')

    logger.debug(f"Using PostgreSQL - Sync URL: {sync_url}, Async URL: {async_url}")

    postgres_args = {
        "pool_pre_ping": True,
        "pool_size": 5,
        "max_overflow": 10,
        "echo": False
    }

    engine = create_engine(sync_url, **postgres_args)
    async_engine = create_async_engine(async_url, **postgres_args)

# Create session factories
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

AsyncSessionLocal = sessionmaker(
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    bind=async_engine
)

# Create thread-safe session
db = scoped_session(SessionLocal)

# Dependency for sync operations
def get_db() -> Generator[Session, None, None]:
    """Get database session."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

# Dependency for async operations
async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """Get async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

def init_db() -> None:
    """Initialize database."""
    # Import all models here to ensure they are registered
    from app.db.base import Base
    from app.models.core.user import User
    from app.models.core.universe import Universe
    from app.models.core.scene import Scene
    from app.models.audio.audio_file import AudioFile
    from app.models.organization.storyboard import Storyboard

    # Create all tables
    Base.metadata.create_all(bind=engine)

# For testing
def get_test_db() -> Generator[Session, None, None]:
    """Get test database session."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

async def get_session() -> AsyncGenerator[Session, None]:
    """Get async database session for testing."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

__all__ = ['SessionLocal', 'AsyncSessionLocal', 'engine', 'async_engine', 'Base', 'get_db', 'get_async_db', 'get_session']
