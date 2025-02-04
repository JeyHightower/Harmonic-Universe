"""
AI model.
"""

from typing import Optional, Dict, List, TYPE_CHECKING
from uuid import UUID
from sqlalchemy import String, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
import enum

from app.db.base_model import Base, GUID

# Handle circular imports
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.ai_generation import AIGeneration

class AIModelType(str, enum.Enum):
    """AI model type enum."""
    TEXT_TO_SCENE = "TEXT_TO_SCENE"
    TEXT_TO_ANIMATION = "TEXT_TO_ANIMATION"
    TEXT_TO_MUSIC = "TEXT_TO_MUSIC"
    TEXT_TO_PHYSICS = "TEXT_TO_PHYSICS"

class AIModel(Base):
    """AI model."""
    __tablename__ = "ai_models"
    __table_args__ = {'extend_existing': True}

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    type: Mapped[AIModelType] = mapped_column(String, nullable=False)
    version: Mapped[str] = mapped_column(String, nullable=False)

    # Model configuration stored as JSON
    config: Mapped[Dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )

    # Model metadata stored as JSON
    model_metadata: Mapped[Dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(nullable=False)
    updated_at: Mapped[datetime] = mapped_column(nullable=False)

    # Relationships
    generations: Mapped[list["AIGeneration"]] = relationship(
        "AIGeneration",
        back_populates="model",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<AIModel {self.name} ({self.type})>"
