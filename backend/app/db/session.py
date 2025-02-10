"""Database session management."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, scoped_session
from sqlalchemy.ext.declarative import declarative_base
from flask import current_app
import os
from contextlib import contextmanager

# Create base class for models
Base = declarative_base()

def get_database_url():
    """Get database URL from environment or config."""
    # First try environment variable
    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        return database_url

    # Then try Flask config if available
    if current_app:
        return current_app.config.get('SQLALCHEMY_DATABASE_URI', 'postgresql://postgres:postgres@localhost:5432/harmonic_universe')

    # Default fallback
    return 'postgresql://postgres:postgres@localhost:5432/harmonic_universe'

def init_engine(database_url=None):
    """Initialize database engine."""
    if database_url is None:
        database_url = get_database_url()

    # Parse URL to handle SQLite specially
    if database_url.startswith('sqlite'):
        engine = create_engine(
            database_url,
            pool_pre_ping=True,
            echo=True,
            connect_args={'check_same_thread': False}
        )
    else:
        engine = create_engine(
            database_url,
            pool_pre_ping=True,
            echo=True
        )

    # Create sessionmaker
    session_local = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )

    # Create scoped session
    db_session = scoped_session(session_local)

    return engine

# Initialize engine and session factories
engine = init_engine()
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)
db_session = scoped_session(SessionLocal)

@contextmanager
def get_db() -> Session:
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database."""
    Base.metadata.create_all(bind=engine)
