"""
Database session configuration.
"""

from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session, Session
from sqlalchemy.pool import QueuePool
from app.core.config import settings
from app.db.base_class import Base

# Create database engine
if str(settings.SQLALCHEMY_DATABASE_URI).startswith('sqlite'):
    engine = create_engine(
        str(settings.SQLALCHEMY_DATABASE_URI),
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,
        echo=False
    )
else:
    engine = create_engine(
        str(settings.SQLALCHEMY_DATABASE_URI),
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        echo=False
    )

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Create thread-safe session
db = scoped_session(SessionLocal)

# Dependency
def get_db() -> Generator[Session, None, None]:
    """Get database session."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def init_db() -> None:
    """Initialize database."""
    # Import all models here to ensure they are registered
    from app.db.base import Base
    from app.models.user import User
    from app.models.universe import Universe
    from app.models.scene import Scene
    from app.models.audio_file import AudioFile
    from app.models.storyboard import Storyboard

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

__all__ = ['SessionLocal', 'engine', 'Base', 'get_db']
