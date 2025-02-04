"""
Import all models here to ensure they are registered with SQLAlchemy.
This is used by Alembic to detect models and generate migrations.
"""

from typing import Any, Dict, Type
from datetime import datetime
import uuid

from sqlalchemy.ext.declarative import as_declarative, declared_attr
from sqlalchemy import Column, DateTime
from sqlalchemy.orm import registry

from app.db.custom_types import GUID
from app.db.base_class import Base
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

# Create registry
mapper_registry = registry()

@as_declarative(metadata=mapper_registry.metadata)
class Base:
    """Base class for SQLAlchemy models."""

    # Auto-generate tablename
    @declared_attr
    def __tablename__(cls) -> str:
        """Generate table name automatically."""
        return cls.__name__.lower()

    # Common columns
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Registry of all models
    _models: Dict[str, Type['Base']] = {}

    @classmethod
    def register_model(cls, model: Type['Base']) -> None:
        """Register a model in the registry."""
        cls._models[model.__name__] = model

    @classmethod
    def get_model(cls, name: str) -> Type['Base']:
        """Get a model from the registry."""
        return cls._models.get(name)

    @classmethod
    def get_all_models(cls) -> Dict[str, Type['Base']]:
        """Get all registered models."""
        return cls._models.copy()

# Register all models
for model in [
    User,
    Universe,
    Scene,
    AudioFile,
    AIModel,
    AIGeneration,
    Storyboard,
    Timeline,
    MusicParameter,
    MidiEvent,
    PerformanceMetrics,
    PhysicsParameter,
    Visualization,
    Keyframe,
    Export,
    PhysicsConstraint,
    PhysicsObject,
    SceneObject
]:
    Base.register_model(model)

# Make sure all models are imported here for Alembic to detect them
__all__ = list(Base.get_all_models().keys())
