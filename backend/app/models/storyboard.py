"""Storyboard model."""

from typing import Dict, List, Optional
from uuid import UUID
from sqlalchemy import String, Integer, ForeignKey, ARRAY, JSON, Text
from sqlalchemy.dialects.postgresql import JSONB, ARRAY as PG_ARRAY
from app.db.custom_types import GUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.db.base_class import Base

# Handle circular imports
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.universe import Universe
    from app.models.keyframe import Keyframe

class Storyboard(Base):
    """Storyboard model."""
    __tablename__ = "storyboards"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    timeline_data: Mapped[dict] = mapped_column(
        JSONB().with_variant(JSON(), 'sqlite'),
        server_default='{}'
    )  # Stores timeline structure and keyframes
    scene_order: Mapped[List[UUID]] = mapped_column(
        PG_ARRAY(GUID()).with_variant(JSON(), 'sqlite'),
        server_default='[]'
    )  # Ordered list of scene IDs
    transitions: Mapped[dict] = mapped_column(
        JSONB().with_variant(JSON(), 'sqlite'),
        server_default='{}'
    )  # Transition effects between scenes
    narrative: Mapped[dict] = mapped_column(
        JSONB().with_variant(JSON(), 'sqlite'),
        server_default='{}'
    )  # Narrative elements and annotations
    storyboard_metadata: Mapped[dict] = mapped_column(
        JSONB().with_variant(JSON(), 'sqlite'),
        server_default='{}'
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

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<Storyboard {self.title}>"
