"""
Keyframe model.
"""

from typing import Dict, Optional, TYPE_CHECKING
from uuid import UUID
from sqlalchemy import String, Float, ForeignKey, Enum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
import enum

from app.db.base_model import Base, GUID
from app.models.organization.storyboard import Storyboard

# Handle circular imports
if TYPE_CHECKING:
    from app.models.core.scene import Scene
    from app.models.timeline import Animation

class ParameterType(str, enum.Enum):
    """Parameter type enum."""
    PHYSICS = "physics"
    MUSIC = "music"
    VISUAL = "visual"
    NARRATIVE = "narrative"

class Keyframe(Base):
    """Keyframe model."""
    __tablename__ = "keyframes"
    __table_args__ = {'extend_existing': True}

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True)
    timestamp: Mapped[float] = mapped_column(nullable=False)
    data: Mapped[Dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )

    # Foreign keys
    storyboard_id: Mapped[UUID] = mapped_column(
        GUID(),
        ForeignKey("storyboards.id"),
        nullable=False
    )
    animation_id: Mapped[UUID] = mapped_column(
        GUID(),
        ForeignKey("animations.id", ondelete="CASCADE"),
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
