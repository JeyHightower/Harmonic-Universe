"""Storyboard model."""
from datetime import datetime, timezone
from ..extensions import db
from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from .base import BaseModel


class Storyboard(BaseModel):
    """Storyboard model for storing story elements and harmony ties."""

    __tablename__ = "storyboards"
    __table_args__ = (
        db.Index("idx_universe_id", "universe_id"),
        db.Index("idx_harmony_value", "harmony_value"),
        db.Index("idx_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True)
    universe_id = Column(Integer, ForeignKey("universes.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    harmony_value = Column(Float)  # Tie to universe's harmony
    sequence_number = Column(Integer)  # Order in the story
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    universe = relationship("Universe", back_populates="storyboards")

    def __init__(
        self,
        universe_id: int,
        title: str,
        description: str = None,
        harmony_value: float = None,
        sequence_number: int = None,
    ):
        self.universe_id = universe_id
        self.title = title
        self.description = description
        self.harmony_value = harmony_value
        self.sequence_number = sequence_number

    def to_dict(self):
        """Convert storyboard to dictionary."""
        return {
            "id": self.id,
            "universe_id": self.universe_id,
            "title": self.title,
            "description": self.description,
            "harmony_value": self.harmony_value,
            "sequence_number": self.sequence_number,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @staticmethod
    def validate_harmony_value(value):
        """Validate harmony value."""
        if value is not None and not isinstance(value, (int, float)):
            return False, "Harmony value must be a number"
        if value is not None and not 0 <= value <= 1:
            return False, "Harmony value must be between 0 and 1"
        return True, None

    def update_harmony(self, value):
        """Update harmony value with validation."""
        valid, message = self.validate_harmony_value(value)
        if not valid:
            return False, message
        self.harmony_value = value
        return True, None

    def __repr__(self):
        return f"<Storyboard {self.title}>"
