"""Scene model module."""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .. import db
from .base_models import BaseModel, TimestampMixin

class Scene(BaseModel, TimestampMixin):
    """Scene model for organizing content within storyboards."""

    __tablename__ = 'scenes'

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    sequence = Column(Integer)
    storyboard_id = Column(Integer, ForeignKey('storyboards.id'), nullable=False)
    content = Column(JSON, default=dict)

    # Relationships
    storyboard = relationship('Storyboard', back_populates='scenes')
    visual_effects = relationship('VisualEffect', back_populates='scene', cascade='all, delete-orphan')
    audio_tracks = relationship('AudioTrack', back_populates='scene', cascade='all, delete-orphan')

    def to_dict(self):
        """Convert scene to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'sequence': self.sequence,
            'storyboard_id': self.storyboard_id,
            'content': self.content,
            'visual_effects': [effect.to_dict() for effect in self.visual_effects],
            'audio_tracks': [track.to_dict() for track in self.audio_tracks],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
