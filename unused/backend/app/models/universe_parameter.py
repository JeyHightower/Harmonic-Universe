"""Universe parameter model."""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.extensions import db


class UniverseParameter(db.Model):
    """Model for universe parameters."""

    __tablename__ = "universe_parameters"
    __table_args__ = (
        db.Index("idx_universe_id", "universe_id"),
        db.Index("idx_name", "name"),
        db.Index("idx_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True)
    universe_id = Column(
        Integer, ForeignKey("universes.id", ondelete="CASCADE"), nullable=False
    )
    name = Column(String(100), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(50))
    description = Column(String(500))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    universe = relationship("Universe", back_populates="parameters")

    def __init__(
        self,
        universe_id: int,
        name: str,
        value: float,
        unit: str = None,
        description: str = None,
    ):
        """Initialize a universe parameter."""
        self.universe_id = universe_id
        self.name = name
        self.value = value
        self.unit = unit
        self.description = description

    def to_dict(self):
        """Convert parameter to dictionary."""
        return {
            "id": self.id,
            "universe_id": self.universe_id,
            "name": self.name,
            "value": self.value,
            "unit": self.unit,
            "description": self.description,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __repr__(self):
        """Return string representation."""
        return f'<UniverseParameter {self.id}: {self.name} = {self.value} {self.unit or ""}>'
