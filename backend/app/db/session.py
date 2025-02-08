"""Database session management."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
import os

# Create SQLAlchemy engine
database_url = os.environ.get('SQLALCHEMY_DATABASE_URI') or \
    os.environ.get('DATABASE_URL') or \
    'postgresql://postgres:postgres@localhost:5432/harmonic_universe'
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

# Create base class
Base = declarative_base()

def get_db() -> Session:
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
