"""Scene model module."""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import List, Optional, Dict, Any
from .. import db
from .base_models import BaseModel, TimestampMixin

class Scene(BaseModel, TimestampMixin):
    """Scene model for organizing content within storyboards."""

    __tablename__ = 'scenes'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    sequence: Mapped[Optional[int]] = mapped_column(Integer)
    storyboard_id: Mapped[int] = mapped_column(Integer, ForeignKey('storyboards.id'), nullable=False)
    content: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)

    # Physics simulation settings
    physics_settings: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        default=lambda: {
            "gravity": {"x": 0, "y": -9.81},
            "time_step": 1/60,
            "velocity_iterations": 8,
            "position_iterations": 3,
            "enabled": False
        }
    )

    # Relationships with type hints
    storyboard: Mapped["Storyboard"] = relationship("Storyboard", back_populates="scenes")
    visual_effects: Mapped[List["VisualEffect"]] = relationship(
        "VisualEffect",
        back_populates="scene",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    audio_tracks: Mapped[List["AudioTrack"]] = relationship(
        "AudioTrack",
        back_populates="scene",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    physics_objects: Mapped[List["PhysicsObject"]] = relationship(
        "PhysicsObject",
        back_populates="scene",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    physics_constraints: Mapped[List["PhysicsConstraint"]] = relationship(
        "PhysicsConstraint",
        back_populates="scene",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert scene to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'sequence': self.sequence,
            'storyboard_id': self.storyboard_id,
            'content': self.content,
            'physics_settings': self.physics_settings,
            'visual_effects': [effect.to_dict() for effect in self.visual_effects],
            'audio_tracks': [track.to_dict() for track in self.audio_tracks],
            'physics_objects': [obj.to_dict() for obj in self.physics_objects],
            'physics_constraints': [constraint.to_dict() for constraint in self.physics_constraints],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
