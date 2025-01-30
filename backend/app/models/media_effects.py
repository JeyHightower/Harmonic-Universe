"""Media effects models module."""
from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .. import db
from .base_models import BaseModel, TimestampMixin

class VisualEffect(BaseModel, TimestampMixin):
    """Visual effect model for scenes."""

    __tablename__ = 'visual_effects'

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    effect_type = Column(String(50), nullable=False)
    parameters = Column(JSON, default=dict)
    scene_id = Column(Integer, ForeignKey('scenes.id'), nullable=False)

    # Relationships
    scene = relationship('Scene', back_populates='visual_effects')

    def to_dict(self):
        """Convert visual effect to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'effect_type': self.effect_type,
            'parameters': self.parameters,
            'scene_id': self.scene_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class AudioTrack(BaseModel, TimestampMixin):
    """Audio track model for scenes."""

    __tablename__ = 'audio_tracks'

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    track_type = Column(String(50), nullable=False)  # e.g., background, effect, voice
    file_path = Column(String(255))
    parameters = Column(JSON, default=dict)
    scene_id = Column(Integer, ForeignKey('scenes.id'), nullable=False)

    # Relationships
    scene = relationship('Scene', back_populates='audio_tracks')

    def to_dict(self):
        """Convert audio track to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'track_type': self.track_type,
            'file_path': self.file_path,
            'parameters': self.parameters,
            'scene_id': self.scene_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
