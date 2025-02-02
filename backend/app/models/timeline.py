"""
Timeline and Animation models.
"""

from typing import Dict, List, Optional
from uuid import UUID
from sqlalchemy import String, Float, ForeignKey
from app.db.custom_types import GUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.db.base_class import Base

# Handle circular imports
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.scene import Scene
    from app.models.animation import Animation

class Timeline(Base):
    """Timeline model."""
    __tablename__ = "timeline"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    duration: Mapped[float] = mapped_column(Float, nullable=False)
    scene_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("scene.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    scene: Mapped["Scene"] = relationship("Scene", back_populates="timelines")
    animations: Mapped[List["Animation"]] = relationship("Animation", back_populates="timeline", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Timeline {self.name}>"

class Animation(Base):
    """Animation model."""
    __tablename__ = "animation"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    target_object: Mapped[str] = mapped_column(String, nullable=False)  # ID of the object being animated
    property_path: Mapped[str] = mapped_column(String, nullable=False)  # Path to the property being animated
    timeline_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("timeline.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    timeline: Mapped["Timeline"] = relationship("Timeline", back_populates="animations")
    keyframes: Mapped[List["Keyframe"]] = relationship("Keyframe", back_populates="animation", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Animation {self.name}>"
