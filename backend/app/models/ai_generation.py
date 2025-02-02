"""AI Generation model."""

from typing import Dict, Optional, List
from uuid import UUID
from sqlalchemy import String, ForeignKey, Enum, Boolean, JSON, Text
from sqlalchemy.dialects.postgresql import JSONB
from app.db.custom_types import GUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
import enum
import uuid

from app.db.base_class import Base
from .ai_model import AIModelType

# Handle circular imports
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.ai_model import AIModel
    from app.models.universe import Universe
    from app.models.audio_file import AudioFile

class GenerationStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class AIGeneration(Base):
    """AI Generation model."""
    __tablename__ = "ai_generations"
    __table_args__ = {'extend_existing': True}

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    model_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("ai_model.id", ondelete="CASCADE"))
    universe_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("universes.id", ondelete="CASCADE"))
    generation_type: Mapped[AIModelType] = mapped_column(Enum(AIModelType), nullable=False)
    status: Mapped[GenerationStatus] = mapped_column(Enum(GenerationStatus), default=GenerationStatus.PENDING)
    input_data: Mapped[dict] = mapped_column(
        JSONB().with_variant(JSON(), 'sqlite'),
        nullable=False
    )  # Input parameters for generation
    output_data: Mapped[Optional[dict]] = mapped_column(
        JSONB().with_variant(JSON(), 'sqlite'),
        nullable=True
    )  # Generated results
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Error details if failed
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False)  # Whether results are approved
    generation_metadata: Mapped[dict] = mapped_column(
        JSONB().with_variant(JSON(), 'sqlite'),
        server_default='{}'
    )  # Additional generation properties
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    model: Mapped["AIModel"] = relationship("AIModel", backref="generations")
    universe: Mapped["Universe"] = relationship("Universe", back_populates="ai_generations")
    audio_files: Mapped[List["AudioFile"]] = relationship("AudioFile", back_populates="generation")

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<AIGeneration {self.id} ({self.status})>"
