"""Database session management."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, scoped_session
from sqlalchemy.ext.declarative import declarative_base
from flask import current_app
import os
from contextlib import contextmanager

# Create base class for models
Base = declarative_base()

# Global variables for engine and session factory
engine = None
SessionLocal = None
db_session = None

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
    global engine, SessionLocal, db_session

    if database_url is None:
        database_url = get_database_url()

    engine = create_engine(
        database_url,
        pool_pre_ping=True,
        echo=True
    )

    # Create sessionmaker
    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )

    # Create scoped session
    db_session = scoped_session(SessionLocal)

    return engine

@contextmanager
def get_db() -> Session:
    """Get database session."""
    if SessionLocal is None:
        init_engine()

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database."""
    if engine is None:
        init_engine()
    Base.metadata.create_all(bind=engine)
