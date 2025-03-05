"""Database setup script."""
import os
import sys
from sqlalchemy import Table, Column, ForeignKey, String, DateTime, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID

# Add backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

from backend.app.db.session import Base, engine
from backend.app.models.base import BaseModel
from backend.app.models.user import User
from backend.app.models.universe.universe import Universe
from backend.app.models.universe.scene import Scene
from backend.app.models.physics.physics_object import PhysicsObject
from backend.app.models.physics.physics_constraint import PhysicsConstraint
from backend.app.models.physics.physics_parameter import PhysicsParameter
from backend.app.models.audio.audio_track import AudioTrack
from backend.app.models.audio.midi_sequence import MIDISequence
from backend.app.models.audio.audio_file import AudioFile
from backend.app.models.visualization import Visualization
from backend.app.models.ai.ai_model import AIModel
from backend.app.models.organization.organization import Organization, Project, Activity

# Create project_users association table
project_users = Table(
    'project_users',
    Base.metadata,
    Column('project_id', UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE')),
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'))
)

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
