"""
Scene model.
"""

from typing import Dict, List, Optional, TYPE_CHECKING
from uuid import UUID, uuid4
from sqlalchemy import String, ForeignKey, Enum, JSON
from sqlalchemy.dialects.postgresql import JSONB
from app.db.custom_types import GUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
import enum

from app.db.base_class import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.universe import Universe
    from app.models.timeline import Timeline
    from app.models.export import Export
    from app.models.visualization import Visualization
    from app.models.storyboard import Storyboard

class RenderingMode(str, enum.Enum):
    """Rendering mode enum."""
    WIREFRAME = "wireframe"
    SOLID = "solid"
    TEXTURED = "textured"
    REALISTIC = "realistic"

class SceneObjectType(str, enum.Enum):
    """Scene object type enum."""
    MESH = "mesh"
    LIGHT = "light"
    CAMERA = "camera"
    PARTICLE = "particle"
    SOUND = "sound"
    EFFECT = "effect"

class Scene(Base):
    """Scene model."""
    __tablename__ = "scene"
    __table_args__ = {'extend_existing': True}

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    physics_parameters: Mapped[dict] = mapped_column(
        JSONB().with_variant(JSON(), 'sqlite'),
        server_default='{}'
    )
    music_parameters: Mapped[dict] = mapped_column(
        JSONB().with_variant(JSON(), 'sqlite'),
        server_default='{}'
    )
    rendering_mode: Mapped[RenderingMode] = mapped_column(Enum(RenderingMode), default=RenderingMode.SOLID)
    creator_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False)
    universe_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("universes.id", ondelete="CASCADE"), nullable=False)
    storyboard_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("storyboards.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    creator: Mapped["User"] = relationship("User", back_populates="scenes")
    universe: Mapped["Universe"] = relationship("Universe", back_populates="scenes")
    timelines: Mapped[List["Timeline"]] = relationship("Timeline", back_populates="scene", cascade="all, delete-orphan")
    exports: Mapped[List["Export"]] = relationship("Export", back_populates="scene", cascade="all, delete-orphan")
    visualizations: Mapped[List["Visualization"]] = relationship("Visualization", back_populates="scene", cascade="all, delete-orphan")
    objects: Mapped[List["SceneObject"]] = relationship("SceneObject", back_populates="scene", cascade="all, delete-orphan")
    storyboard: Mapped["Storyboard"] = relationship("Storyboard", back_populates="scenes")
    physics_objects: Mapped[List["PhysicsObject"]] = relationship("PhysicsObject", back_populates="scene", cascade="all, delete-orphan")
    physics_constraints: Mapped[List["PhysicsConstraint"]] = relationship("PhysicsConstraint", back_populates="scene", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<Scene {self.name} (Storyboard ID: {self.storyboard_id})>"

class SceneObject(Base):
    """Scene object model."""
    __tablename__ = "scene_object"
    __table_args__ = {'extend_existing': True}

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True)
    scene_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("scene.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[SceneObjectType] = mapped_column(Enum(SceneObjectType), nullable=False)
    properties: Mapped[dict] = mapped_column(
        JSONB().with_variant(JSON(), 'sqlite'),
        server_default='{}'
    )
    object_metadata: Mapped[dict] = mapped_column(
        JSONB().with_variant(JSON(), 'sqlite'),
        server_default='{}'
    )
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    scene: Mapped["Scene"] = relationship("Scene", back_populates="objects")

    def __repr__(self) -> str:
        """Return string representation of scene object."""
        return f"<SceneObject {self.name} ({self.type})>"
