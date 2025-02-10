"""Base module that imports all models to prevent circular imports."""

from app.db.base_class import Base  # noqa

# Core models
from app.models.core.user import User  # noqa
from app.models.universe import Universe  # noqa

# Physics models
from app.models.physics.physics_parameter import PhysicsParameter  # noqa
from app.models.physics.physics_object import PhysicsObject  # noqa
from app.models.physics.physics_constraint import PhysicsConstraint  # noqa

# Audio models
from app.models.audio.audio_file import AudioFile  # noqa
from app.models.audio.audio_track import AudioTrack  # noqa
from app.models.audio.midi_sequence import MIDISequence  # noqa
from app.models.audio.midi_event import MIDIEvent  # noqa
from app.models.audio.audio_control import AudioMarker, AudioAutomation  # noqa

# Visualization models
from app.models.visualization.visualization import Visualization  # noqa

# AI models
from app.models.ai.ai_model import AIModel, TrainingSession, InferenceResult, Dataset  # noqa

# Organization models
from app.models.organization.organization import (  # noqa
    Role,
    Organization,
    Workspace,
    Project,
    Resource,
    Activity
)

# Import all models here to ensure they are registered with SQLAlchemy
# The noqa comments prevent flake8 from complaining about unused imports
