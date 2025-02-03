"""
Timeline and Animation models.
"""

from typing import Dict, List, Optional
from uuid import UUID
from sqlalchemy import String, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.db.base_model import Base
from app.db.custom_types import GUID, JSONType

# Handle circular imports
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.scene import Scene
    from app.models.keyframe import Keyframe

class Timeline(Base):
    """Timeline model."""
    __tablename__ = "timelines"
    __table_args__ = {'extend_existing': True}

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    duration: Mapped[float] = mapped_column(Float, nullable=False)
    scene_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("scenes.id", ondelete="CASCADE"), nullable=False)

    # Timeline settings stored as JSON
    settings: Mapped[dict] = mapped_column(
        JSONType(),
        server_default='{}',
        nullable=False
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    scene: Mapped["Scene"] = relationship("Scene", back_populates="timeline")
    animations: Mapped[List["Animation"]] = relationship(
        "Animation",
        back_populates="timeline",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<Timeline {self.name}>"

class Animation(Base):
    """Animation model."""
    __tablename__ = "animations"
    __table_args__ = {'extend_existing': True}

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    target_object: Mapped[str] = mapped_column(String, nullable=False)  # ID of the object being animated
    property_path: Mapped[str] = mapped_column(String, nullable=False)  # Path to the property being animated
    timeline_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("timelines.id", ondelete="CASCADE"), nullable=False)

    # Animation settings stored as JSON
    settings: Mapped[dict] = mapped_column(
        JSONType(),
        server_default='{}',
        nullable=False
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    timeline: Mapped["Timeline"] = relationship("Timeline", back_populates="animations")
    keyframes: Mapped[List["Keyframe"]] = relationship(
        "Keyframe",
        back_populates="animation",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<Animation {self.name}>"
