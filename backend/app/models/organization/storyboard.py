"""Storyboard model."""

from typing import Dict, List, Optional, TYPE_CHECKING
from uuid import UUID
from sqlalchemy import String, Integer, ForeignKey, JSON, Text, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.db.base_model import Base, GUID

# Handle circular imports
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.universe import Universe
    from app.models.keyframe import Keyframe
    from app.models.scene import Scene
    from app.models.user import User

# Association table for storyboard-scene relationship
storyboard_scenes = Table(
    "storyboard_scenes",
    Base.metadata,
    Column("storyboard_id", GUID(), ForeignKey("storyboards.id", ondelete="CASCADE"), primary_key=True),
    Column("scene_id", GUID(), ForeignKey("scenes.id", ondelete="CASCADE"), primary_key=True),
    extend_existing=True
)

class Storyboard(Base):
    """Storyboard model."""
    __tablename__ = "storyboards"
    __table_args__ = {'extend_existing': True}

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    timeline_data: Mapped[Dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )  # Stores timeline structure and keyframes
    scene_order: Mapped[List[UUID]] = mapped_column(
        JSON,
        server_default='[]',
        nullable=False
    )  # Ordered list of scene IDs
    transitions: Mapped[Dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )  # Transition effects between scenes
    narrative: Mapped[Dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )  # Narrative elements and annotations
    storyboard_metadata: Mapped[Dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )  # Additional storyboard properties

    # Foreign keys
    universe_id: Mapped[UUID] = mapped_column(
        GUID(),
        ForeignKey("universes.id"),
        nullable=False
    )
    creator_id: Mapped[UUID] = mapped_column(
        GUID(),
        ForeignKey("users.id"),
        nullable=False
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    universe: Mapped["Universe"] = relationship("Universe", back_populates="storyboards")
    creator: Mapped["User"] = relationship("User", back_populates="storyboards")
    keyframes: Mapped[List["Keyframe"]] = relationship("Keyframe", back_populates="storyboard", cascade="all, delete-orphan")
    scenes: Mapped[List["Scene"]] = relationship(
        "Scene",
        secondary=storyboard_scenes,
        back_populates="storyboards",
        cascade="all"
    )

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<Storyboard {self.title}>"
