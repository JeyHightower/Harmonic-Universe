"""
Scene model.
"""

from typing import Dict, Optional, TYPE_CHECKING, List
from uuid import UUID, uuid4
from sqlalchemy import String, Column, ForeignKey, Enum as SQLAlchemyEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from pydantic import BaseModel

from app.db.base_model import Base, GUID
from app.models.storyboard import storyboard_scenes

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.universe import Universe
    from app.models.timeline import Timeline
    from app.models.storyboard import Storyboard
    from app.models.visualization import Visualization
    from app.models.export import Export
    from app.models.physics_constraint import PhysicsConstraint
    from app.models.audio_file import AudioFile
    from app.models.physics_object import PhysicsObject
    from app.models.scene_object import SceneObject

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

class RenderingMode(str, enum.Enum):
    """Rendering mode enum."""
    WIREFRAME = "wireframe"
    SOLID = "solid"
    TEXTURED = "textured"
    REALISTIC = "realistic"
    WEBGL = "webgl"

    def __str__(self) -> str:
        return self.value

class Scene(Base):
    """Scene model."""
    __tablename__ = "scenes"
    __table_args__ = {'extend_existing': True}

    # Primary fields
    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    creator_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False)
    universe_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("universes.id"), nullable=False)
    rendering_mode: Mapped[RenderingMode] = mapped_column(
        SQLAlchemyEnum(RenderingMode, name="rendering_mode_enum", create_constraint=True),
        nullable=False,
        default=RenderingMode.SOLID
    )

    # Relationships
    creator = relationship("User", back_populates="scenes", lazy="joined")
    universe: Mapped["Universe"] = relationship("Universe", back_populates="scenes")
    timelines: Mapped[List["Timeline"]] = relationship("Timeline", back_populates="scene", cascade="all, delete-orphan", lazy="selectin")
    storyboards: Mapped[List["Storyboard"]] = relationship("Storyboard", secondary=storyboard_scenes, back_populates="scenes", lazy="selectin")
    visualizations: Mapped[List["Visualization"]] = relationship("Visualization", back_populates="scene", cascade="all, delete-orphan", lazy="selectin")
    exports: Mapped[List["Export"]] = relationship("Export", back_populates="scene", cascade="all, delete-orphan", lazy="selectin")
    physics_constraints: Mapped[List["PhysicsConstraint"]] = relationship("PhysicsConstraint", back_populates="scene", cascade="all, delete-orphan", lazy="selectin")
    audio_files: Mapped[List["AudioFile"]] = relationship("AudioFile", back_populates="scene", cascade="all, delete-orphan", lazy="selectin")
    physics_objects: Mapped[List["PhysicsObject"]] = relationship("PhysicsObject", back_populates="scene", cascade="all, delete-orphan", lazy="selectin")
    scene_objects: Mapped[List["SceneObject"]] = relationship("SceneObject", back_populates="scene", cascade="all, delete-orphan", lazy="selectin")

    # Scene settings
    settings: Mapped[Dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )

    # Scene data
    data: Mapped[Dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<Scene {self.name}>"
