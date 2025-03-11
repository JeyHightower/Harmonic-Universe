"""Harmony Parameter model."""
from sqlalchemy import Column, String, Boolean, Float, ForeignKey, JSON, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from ..base import BaseModel


class HarmonyParameter(BaseModel):
    """Harmony Parameter model for managing audio and music parameters in a scene."""

    __tablename__ = "harmony_parameters"

    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # e.g., tempo, key, scale, instrument
    value = Column(
        JSONB, nullable=False
    )  # Flexible JSON structure for different parameter types
    unit = Column(String(50))
    min_value = Column(JSONB)  # Minimum allowed value
    max_value = Column(JSONB)  # Maximum allowed value
    enabled = Column(Boolean, default=True)

    # Foreign Keys
    scene_id = Column(
        UUID(as_uuid=True), ForeignKey("scenes.id", ondelete="CASCADE"), nullable=False
    )

    # Relationships
    scene = relationship("Scene", back_populates="harmony_parameters")

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "value": self.value,
            "unit": self.unit,
            "min_value": self.min_value,
            "max_value": self.max_value,
            "enabled": self.enabled,
            "scene_id": self.scene_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
