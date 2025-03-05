"""Database setup script for all tables."""
import os
import sys
from sqlalchemy import Table, Column, ForeignKey, String, DateTime, Boolean, Integer, JSON, Float
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid
from datetime import datetime

# Add backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

from backend.app.db.session import engine
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Users table
class User(Base):
    __tablename__ = 'users'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean(), default=True)
    is_verified = Column(Boolean(), default=False)
    verification_token = Column(String(255), unique=True, nullable=True)
    verification_token_expires = Column(DateTime, nullable=True)
    reset_token = Column(String(255), unique=True, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    refresh_token = Column(String(255), unique=True, nullable=True)
    refresh_token_expires = Column(DateTime, nullable=True)
    color = Column(String(7), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Universes table
class Universe(Base):
    __tablename__ = 'universes'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(String(1000))
    is_public = Column(Boolean, default=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'))
    version = Column(Integer, default=1)
    physics_params = Column(JSON)
    harmony_params = Column(JSON)
    story_points = Column(JSON)
    visualization_params = Column(JSON)
    ai_params = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Scenes table
class Scene(Base):
    __tablename__ = 'scenes'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(String(1000))
    universe_id = Column(UUID(as_uuid=True), ForeignKey('universes.id', ondelete='CASCADE'))
    creator_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'))
    physics_state = Column(JSON)
    harmony_state = Column(JSON)
    visualization_state = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Physics Objects table
class PhysicsObject(Base):
    __tablename__ = 'physics_objects'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)
    universe_id = Column(UUID(as_uuid=True), ForeignKey('universes.id', ondelete='CASCADE'))
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'))
    position = Column(JSON)  # {x: float, y: float, z: float}
    rotation = Column(JSON)  # {x: float, y: float, z: float}
    scale = Column(JSON)    # {x: float, y: float, z: float}
    mass = Column(Float)
    velocity = Column(JSON)  # {x: float, y: float, z: float}
    parameters = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Audio Tracks table
class AudioTrack(Base):
    __tablename__ = 'audio_tracks'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    universe_id = Column(UUID(as_uuid=True), ForeignKey('universes.id', ondelete='CASCADE'))
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'))
    file_path = Column(String(1000))
    duration = Column(Float)
    parameters = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

def setup_database():
    """Create all database tables."""
    print("Creating database tables...")

    # Drop all tables first
    Base.metadata.drop_all(bind=engine)
    print("Dropped all existing tables")

    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("Created all tables")

    print("Database tables created successfully!")

if __name__ == "__main__":
    setup_database()
