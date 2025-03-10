"""Storyboard model."""
from sqlalchemy import Column, String, ForeignKey, Text, DateTime, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from backend.app.models.base import Base

class Storyboard(Base):
    """Storyboard model."""

    __tablename__ = 'storyboards'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    universe_id = Column(UUID(as_uuid=True), ForeignKey('universes.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    universe = relationship("Universe", back_populates="storyboards")
    story_points = relationship("StoryPoint", back_populates="storyboard", cascade="all, delete-orphan")

    def __repr__(self):
        """Return string representation of the storyboard."""
        return f"<Storyboard {self.name}>"

    def to_dict(self):
        """Convert to dictionary."""
        return {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'universe_id': str(self.universe_id),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'point_count': len(self.story_points) if self.story_points else 0
        }
