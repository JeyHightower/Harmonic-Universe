"""Database setup script for core tables."""
import os
import sys

# Add backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

from sqlalchemy import create_engine, MetaData, Table, Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

# Create engine
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/harmonic_universe_dev"
engine = create_engine(DATABASE_URL)

# Create MetaData instance
metadata = MetaData()

# Define tables
users = Table(
    'users',
    metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column('username', String(255), unique=True, nullable=False),
    Column('email', String(255), unique=True, nullable=False),
    Column('password_hash', String(255), nullable=False),
    Column('is_active', Boolean(), default=True),
    Column('is_verified', Boolean(), default=False),
    Column('verification_token', String(255), unique=True, nullable=True),
    Column('verification_token_expires', DateTime, nullable=True),
    Column('reset_token', String(255), unique=True, nullable=True),
    Column('reset_token_expires', DateTime, nullable=True),
    Column('refresh_token', String(255), unique=True, nullable=True),
    Column('refresh_token_expires', DateTime, nullable=True),
    Column('color', String(7), nullable=True),
    Column('created_at', DateTime, default=datetime.utcnow),
    Column('updated_at', DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
)

def setup_database():
    """Create core database tables."""
    print("Creating core database tables...")

    # Drop all tables first
    metadata.drop_all(bind=engine)
    print("Dropped all existing tables")

    # Create all tables
    metadata.create_all(bind=engine)
    print("Created core tables")

    print("Database tables created successfully!")

if __name__ == "__main__":
    setup_database()
