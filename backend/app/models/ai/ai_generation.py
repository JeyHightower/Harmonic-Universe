"""
AI generation model.
"""

from typing import Optional, Dict
from uuid import UUID
from sqlalchemy import String, ForeignKey, Boolean, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
import enum

from app.db.base_model import Base, GUID

# Handle circular imports
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.ai_model import AIModel
    from app.models.user import User
    from app.models.universe import Universe

class GenerationStatus(str, enum.Enum):
    """Generation status enum."""
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class AIGeneration(Base):
    """AI generation model."""
    __tablename__ = "ai_generations"
    __table_args__ = {'extend_existing': True}

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True)
    model_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("ai_models.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    universe_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("universes.id", ondelete="CASCADE"), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[GenerationStatus] = mapped_column(String, nullable=False)
    is_saved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    error_message: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Generation parameters stored as JSON
    parameters: Mapped[Dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )

    # Generation results stored as JSON
    results: Mapped[Dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )

    # Generation metadata stored as JSON
    generation_metadata: Mapped[Dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(nullable=False)
    updated_at: Mapped[datetime] = mapped_column(nullable=False)

    # Relationships
    model = relationship("AIModel", back_populates="generations")
    user = relationship("User", back_populates="ai_generations")
    universe = relationship("Universe", back_populates="ai_generations")

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<AIGeneration {self.id} ({self.status})>"
