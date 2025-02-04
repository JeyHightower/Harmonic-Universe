"""
Import all models here to ensure they are registered with SQLAlchemy.
"""

from app.db.base_class import Base
from app.models.user import User
from app.models.universe import Universe
from app.models.scene import Scene, RenderingMode
from app.models.audio_file import AudioFile
from app.models.ai_model import AIModel
from app.models.ai_generation import AIGeneration
from app.models.storyboard import Storyboard
from app.models.timeline import Timeline
from app.models.music_parameter import MusicParameter
from app.models.midi_event import MidiEvent
from app.models.metrics import PerformanceMetrics
from app.models.physics_parameter import PhysicsParameter
from app.models.visualization import Visualization
from app.models.keyframe import Keyframe
from app.models.export import Export
from app.models.physics_constraint import PhysicsConstraint
from app.models.physics_object import PhysicsObject
from app.models.scene_object import SceneObject

__all__ = [
    'Base',
    'User',
    'Universe',
    'Scene',
    'RenderingMode',
    'AudioFile',
    'AIModel',
    'AIGeneration',
    'Storyboard',
    'Timeline',
    'MusicParameter',
    'MidiEvent',
    'PerformanceMetrics',
    'PhysicsParameter',
    'Visualization',
    'Keyframe',
    'Export',
    'PhysicsConstraint',
    'PhysicsObject',
    'SceneObject'
]
