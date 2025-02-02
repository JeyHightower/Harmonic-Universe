"""
Models package initialization.
Import all models here to avoid circular imports.
"""

from app.db.base_class import Base

# Import models in dependency order
from app.models.user import User  # No dependencies
from app.models.ai_model import AIModel  # No dependencies
from app.models.universe import Universe  # Depends on User
from app.models.scene import Scene  # Depends on Universe, User
from app.models.physics_parameter import PhysicsParameter  # Depends on Universe
from app.models.music_parameter import MusicParameter  # Depends on Universe
from app.models.timeline import Timeline  # Depends on Scene
from app.models.keyframe import Keyframe  # Depends on Timeline
from app.models.visualization import Visualization  # Depends on Scene
from app.models.export import Export  # Depends on Scene
from app.models.ai_generation import AIGeneration  # Depends on Universe, AIModel
from app.models.audio_file import AudioFile, AudioFormat, AudioType  # Depends on Universe, User, AIGeneration
from app.models.storyboard import Storyboard  # Depends on Universe, User
from app.models.midi_event import MIDIEvent  # Depends on Universe

# Define exported models in dependency order
__all__ = [
    "User",
    "AIModel",
    "Universe",
    "Scene",
    "PhysicsParameter",
    "MusicParameter",
    "Timeline",
    "Keyframe",
    "Visualization",
    "Export",
    "AIGeneration",
    "AudioFile",
    "Storyboard",
    "MIDIEvent"
]
