"""Database setup script."""
import os
import sys

# Add backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

# Import all models to ensure they're registered with SQLAlchemy
from backend.app.db.session import init_db, Base, engine
from backend.app.models.base import BaseModel
from backend.app.models.user import User
from backend.app.models.universe.universe import Universe
from backend.app.models.universe.scene import Scene
from backend.app.models.physics.physics_object import PhysicsObject
from backend.app.models.physics.physics_constraint import PhysicsConstraint
from backend.app.models.physics.physics_parameter import PhysicsParameter
from backend.app.models.audio.audio_track import AudioTrack
from backend.app.models.audio.midi_sequence import MIDISequence


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
