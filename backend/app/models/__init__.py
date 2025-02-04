"""
Import all models here to ensure they are registered with SQLAlchemy.
"""

from app.db.base_class import Base

# Core models
from app.models.core.user import User
from app.models.core.universe import Universe
from app.models.core.scene import Scene, RenderingMode

# Audio models
from app.models.audio.audio_file import AudioFile
from app.models.audio.music_parameter import MusicParameter
from app.models.audio.midi_event import MidiEvent

# Physics models
from app.models.physics.physics_object import PhysicsObject
from app.models.physics.physics_constraint import PhysicsConstraint
from app.models.physics.physics_parameter import PhysicsParameter

# Visualization models
from app.models.visualization.visualization import Visualization
from app.models.visualization.keyframe import Keyframe
from app.models.visualization.scene_object import SceneObject

# AI models
from app.models.ai.ai_model import AIModel
from app.models.ai.ai_generation import AIGeneration

# Organization models
from app.models.organization.storyboard import Storyboard
from app.models.organization.timeline import Timeline

# Export all models
__all__ = [
    'Base',
    # Core
    'User',
    'Universe',
    'Scene',
    'RenderingMode',
    # Audio
    'AudioFile',
    'MusicParameter',
    'MidiEvent',
    # Physics
    'PhysicsObject',
    'PhysicsConstraint',
    'PhysicsParameter',
    # Visualization
    'Visualization',
    'Keyframe',
    'SceneObject',
    # AI
    'AIModel',
    'AIGeneration',
    # Organization
    'Storyboard',
    'Timeline',
]
