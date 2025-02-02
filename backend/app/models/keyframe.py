"""
Keyframe model.
"""

from typing import Dict
from uuid import UUID
from sqlalchemy import String, Float, ForeignKey, Enum, JSON
from sqlalchemy.dialects.postgresql import JSONB
from app.db.custom_types import GUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from datetime import datetime

from app.db.base_class import Base

# Handle circular imports
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.storyboard import Storyboard
    from app.models.timeline import Timeline, Animation

class ParameterType(str, enum.Enum):
    """Parameter type enum."""
    PHYSICS = "physics"
    MUSIC = "music"
    VISUAL = "visual"
    NARRATIVE = "narrative"

class Keyframe(Base):
    """Keyframe model."""
    __tablename__ = "keyframes"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True)
    timestamp: Mapped[float] = mapped_column(nullable=False)
    data: Mapped[dict] = mapped_column(
        JSONB().with_variant(JSON(), 'sqlite'),
        server_default='{}',
        nullable=False
    )

    # Foreign keys
    storyboard_id: Mapped[UUID] = mapped_column(
        GUID(),
        ForeignKey("storyboards.id"),  # Note: references "storyboards" not "storyboard"
        nullable=False
    )
    animation_id: Mapped[UUID] = mapped_column(
        GUID(),
        ForeignKey("animation.id", ondelete="CASCADE"),
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
    storyboard: Mapped["Storyboard"] = relationship("Storyboard", back_populates="keyframes")
    animation: Mapped["Animation"] = relationship("Animation", back_populates="keyframes")

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<Keyframe {self.id} at {self.timestamp}>"
