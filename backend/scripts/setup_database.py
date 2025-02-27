"""Database setup script."""
import os
import sys

# Add backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

# Import all models to ensure they're registered with SQLAlchemy
from app.db.session import init_db, Base, engine
from app.models.base import BaseModel
from app.models.user import User
from app.models.universe.universe import Universe
from app.models.universe.scene import Scene
from app.models.physics.physics_object import PhysicsObject
from app.models.physics.physics_constraint import PhysicsConstraint
from app.models.physics.physics_parameter import PhysicsParameter
from app.models.audio.audio_track import AudioTrack
from app.models.audio.midi_sequence import MIDISequence

def setup_database():
    """Create all database tables."""
    print("Creating database tables...")

    # Drop all tables first
    Base.metadata.drop_all(bind=engine)
    print("Dropped all existing tables")

    # Create all tables
    init_db()
    print("Created all tables")

    print("Database tables created successfully!")

if __name__ == "__main__":
    setup_database()
