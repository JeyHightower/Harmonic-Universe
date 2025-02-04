"""
Scene model.
"""

from typing import Dict, Optional, TYPE_CHECKING, List
from uuid import UUID, uuid4
from sqlalchemy import String, Column, ForeignKey, Enum as SQLAlchemyEnum, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from pydantic import BaseModel
from datetime import datetime

from app.db.base_model import Base, GUID
from app.models.organization.storyboard import Storyboard, storyboard_scenes
from app.models.visualization.scene_object import SceneObject

if TYPE_CHECKING:
    from app.models.core.user import User
    from app.models.core.universe import Universe
    from app.models.timeline import Timeline
    from app.models.visualization.visualization import Visualization
    from app.models.export import Export
    from app.models.physics.physics_constraint import PhysicsConstraint
    from app.models.audio.audio_file import AudioFile
    from app.models.physics.physics_object import PhysicsObject
    from app.models.visualization.keyframe import Keyframe

class RenderingMode(str, enum.Enum):
    """Scene rendering mode."""
    DRAFT = "draft"
    PREVIEW = "preview"
    FINAL = "final"

class PhysicsParameters(BaseModel):
    """Physics simulation parameters."""
    gravity: float = 9.81
    air_resistance: float = 0.0
    friction: float = 0.1
    elasticity: float = 0.5
    time_scale: float = 1.0
    iterations: int = 10
    substeps: int = 8
    pause_on_collision: bool = False
    enable_constraints: bool = True

class MusicParameters(BaseModel):
    """Music generation parameters."""
    tempo: int = 120
    scale: str = "C major"
    octave: int = 4
    volume: float = 0.5
    instrument: str = "piano"
    reverb: float = 0.3
    delay: float = 0.0
    enable_quantization: bool = True
    quantize_to: str = "1/4"

class Scene(Base):
    """Scene model."""
    __tablename__ = "scenes"
    __table_args__ = {'extend_existing': True}

    # Primary fields
    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    universe_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("universes.id"), nullable=False)
    creator_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False)

    # Scene configuration
    rendering_mode: Mapped[str] = mapped_column(
        SQLAlchemyEnum(RenderingMode, name="rendering_mode_enum", create_constraint=True),
        default=RenderingMode.DRAFT,
        nullable=False
    )
    physics_parameters: Mapped[Dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )
    music_parameters: Mapped[Dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )

    # Relationships
    universe = relationship("Universe", back_populates="scenes")
    creator = relationship("User", back_populates="scenes")
    scene_objects = relationship("SceneObject", back_populates="scene", cascade="all, delete-orphan")
    storyboards = relationship("Storyboard", secondary=storyboard_scenes, back_populates="scenes")
    timelines: Mapped[List["Timeline"]] = relationship(
        "Timeline",
        back_populates="scene",
        cascade="all, delete-orphan"
    )
    visualizations: Mapped[List["Visualization"]] = relationship(
        "Visualization",
        back_populates="scene",
        cascade="all, delete-orphan"
    )
    audio_files: Mapped[List["AudioFile"]] = relationship(
        "AudioFile",
        back_populates="scene",
        cascade="all, delete-orphan"
    )
    physics_objects: Mapped[List["PhysicsObject"]] = relationship(
        "PhysicsObject",
        back_populates="scene",
        cascade="all, delete-orphan"
    )
    physics_constraints: Mapped[List["PhysicsConstraint"]] = relationship(
        "PhysicsConstraint",
        back_populates="scene",
        cascade="all, delete-orphan"
    )
    exports: Mapped[List["Export"]] = relationship(
        "Export",
        back_populates="scene",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        """String representation."""
        return f"<Scene {self.name}>"
