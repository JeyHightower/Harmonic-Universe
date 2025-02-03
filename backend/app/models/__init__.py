"""
Models package initialization.
Import all models here to avoid circular imports.
"""

from app.db.base_class import Base
from app.db.session import db

# Import models in dependency order
from app.models.user import User  # No dependencies
from app.models.ai_model import AIModel  # No dependencies
from app.models.universe import Universe  # Depends on User
from app.models.scene import Scene, RenderingMode  # Depends on Universe, User
from app.models.physics_parameter import PhysicsParameter  # Depends on Universe
from app.models.music_parameter import MusicParameter  # Depends on Universe
from app.models.timeline import Timeline  # Depends on Scene
from app.models.keyframe import Keyframe  # Depends on Timeline
from app.models.visualization import Visualization  # Depends on Scene
from app.models.export import Export  # Depends on Scene
from app.models.ai_generation import AIGeneration  # Depends on Universe, AIModel
from app.models.audio_file import (  # Depends on Universe, User, AIGeneration
    AudioFile,
    AudioFormat,
    AudioType
)
from app.models.storyboard import Storyboard  # Depends on Universe, User
from app.models.midi_event import MidiEvent  # Depends on AudioFile
from app.models.physics_object import PhysicsObject
from app.models.physics_constraint import PhysicsConstraint
from app.models.relationships import setup_relationships

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
    "MidiEvent",
    "PhysicsObject",
    "PhysicsConstraint"
]

# Set up relationships between models
setup_relationships()
