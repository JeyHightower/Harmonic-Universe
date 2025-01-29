"""Storyboard model."""
from datetime import datetime, timezone
from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from ..extensions import db

class Storyboard(db.Model):
    """Storyboard model for storing storyboard related details."""

    __tablename__ = "storyboards"
    __table_args__ = (
        db.Index("idx_universe_id", "universe_id"),
        db.Index("idx_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True)
    universe_id = Column(Integer, ForeignKey("universes.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(String(1000))
    metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    scenes = relationship(
        "Scene",
        backref="storyboard",
        lazy="dynamic",
        cascade="all, delete-orphan",
        order_by="Scene.sequence"
    )

    def __init__(self, universe_id, title, description=None, metadata=None):
        """Initialize storyboard."""
        self.universe_id = universe_id
        self.title = title
        self.description = description
        self.metadata = metadata or {}

    def to_dict(self):
        """Convert storyboard to dictionary."""
        return {
            "id": self.id,
            "universe_id": self.universe_id,
            "title": self.title,
            "description": self.description,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "scenes": [scene.to_dict() for scene in self.scenes]
        }

    def __repr__(self):
        """String representation."""
        return f"<Storyboard(id={self.id}, title='{self.title}')>"
