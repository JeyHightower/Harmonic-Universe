"""Database session management."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, scoped_session
from sqlalchemy.ext.declarative import declarative_base
from flask import current_app
import os
import json
from pathlib import Path
from contextlib import contextmanager

# Create base class for models
Base = declarative_base()


def get_database_url():
    """Get database URL from environment or config."""
    # First try environment variable
    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        return database_url

    # Then try config file
    config_path = Path(__file__).parent.parent.parent / "config" / "development.json"
    if config_path.exists():
        with open(config_path) as f:
            config = json.load(f)
            if "database" in config and "url" in config["database"]:
                return config["database"]["url"]

    # Then try Flask config if available
    if current_app:
        return current_app.config.get("SQLALCHEMY_DATABASE_URI")

    # Default fallback for development
    return "postgresql://postgres:postgres@localhost:5432/harmonic_universe_dev"


def init_engine(database_url=None):
    """Initialize database engine."""
    if database_url is None:
        database_url = get_database_url()

    # Parse URL to handle SQLite specially
    if database_url.startswith("sqlite"):
        engine = create_engine(
            database_url,
            pool_pre_ping=True,
            echo=True,
            connect_args={"check_same_thread": False},
        )
    else:
        engine = create_engine(
            database_url, pool_pre_ping=True, pool_size=5, max_overflow=10, echo=True
        )

    return engine


# Initialize engine and session factories
engine = init_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
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
