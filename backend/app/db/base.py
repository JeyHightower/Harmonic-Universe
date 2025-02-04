"""
Import all models here to ensure they are registered with SQLAlchemy.
This is used by Alembic to detect models and generate migrations.
"""

from app.db.base_model import Base
from app.models.core.user import User
from app.models.core.universe import Universe
from app.models.core.scene import Scene, RenderingMode
from app.models.audio.audio_file import AudioFile
from app.models.ai.ai_model import AIModel
from app.models.ai.ai_generation import AIGeneration
from app.models.organization.storyboard import Storyboard
from app.models.organization.timeline import Timeline
from app.models.audio.music_parameter import MusicParameter
from app.models.audio.midi_event import MidiEvent
from app.models.metrics import PerformanceMetrics
from app.models.physics.physics_parameter import PhysicsParameter
from app.models.visualization.visualization import Visualization
from app.models.visualization.keyframe import Keyframe
from app.models.export import Export
from app.models.physics.physics_constraint import PhysicsConstraint
from app.models.physics.physics_object import PhysicsObject
from app.models.visualization.scene_object import SceneObject

# Make sure all models are imported here for Alembic to detect them
__all__ = [
    'User',
    'Universe',
    'Scene',
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
