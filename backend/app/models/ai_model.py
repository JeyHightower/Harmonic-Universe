"""AI model definition."""

from typing import Dict, Optional
from uuid import UUID
from sqlalchemy import String, ForeignKey, Enum, JSON
from sqlalchemy.dialects.postgresql import JSONB
from app.db.custom_types import GUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
import enum
import uuid

from app.db.base_class import Base

class AIModelType(str, enum.Enum):
    PARAMETER_GENERATION = "parameter_generation"
    MUSIC_GENERATION = "music_generation"
    VISUALIZATION = "visualization"

class AIModel(Base):
    __tablename__ = "ai_model"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    model_type: Mapped[AIModelType] = mapped_column(Enum(AIModelType), nullable=False)
    provider: Mapped[str] = mapped_column(String, nullable=False)  # e.g., "openai", "anthropic", "local"
    configuration: Mapped[Dict] = mapped_column(
        JSONB().with_variant(JSON(), 'sqlite'),
        server_default='{}'
    )  # Model-specific settings
    api_key: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # Encrypted API key if needed
    parameters: Mapped[Dict] = mapped_column(
        JSONB().with_variant(JSON(), 'sqlite'),
        server_default='{}'
    )  # Model parameters and hyperparameters
    model_metadata: Mapped[Dict] = mapped_column(
        JSONB().with_variant(JSON(), 'sqlite'),
        server_default='{}'
    )  # Additional model properties

    def __repr__(self) -> str:
        return f"<AIModel {self.name} ({self.model_type})>"
