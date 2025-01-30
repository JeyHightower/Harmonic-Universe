"""Storyboard model module."""
from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from .. import db
from .base_models import BaseModel, TimestampMixin

class Storyboard(BaseModel, TimestampMixin):
    """Storyboard model for organizing scenes."""

    __tablename__ = 'storyboards'

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    universe_id = Column(Integer, ForeignKey('universes.id'), nullable=False)

    # Relationships
    universe = relationship('Universe', back_populates='storyboards')
    scenes = relationship(
        'Scene',
        back_populates='storyboard',
        cascade='all, delete-orphan',
        lazy='dynamic'
    )

    def to_dict(self):
        """Convert storyboard to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'universe_id': self.universe_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
