"""VisualEffect model."""
from datetime import datetime, timezone
from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, event
from ..extensions import db
from typing import Dict, Any

class VisualEffect(db.Model):
    """VisualEffect model for storing visual effect related details."""

    __tablename__ = "visual_effects"
    __table_args__ = (
        db.Index("idx_scene_id", "scene_id"),
        db.Index("idx_effect_type", "effect_type"),
    )

    # Effect type constants
    TYPE_PARTICLE = 'particle'
    TYPE_SHADER = 'shader'
    TYPE_POST_PROCESS = 'post_process'
    TYPE_ENVIRONMENT = 'environment'

    VALID_TYPES = [TYPE_PARTICLE, TYPE_SHADER, TYPE_POST_PROCESS, TYPE_ENVIRONMENT]

    id = Column(Integer, primary_key=True)
    scene_id = Column(Integer, ForeignKey("scenes.id", ondelete="CASCADE"), nullable=False)
    effect_type = Column(String(50), nullable=False)
    parameters = Column(JSON, nullable=False)
    start_time = Column(Float, nullable=False)
    duration = Column(Float, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    scene = relationship("Scene", back_populates="visual_effects")

    def __init__(self, scene_id, effect_type, parameters, start_time, duration):
        """Initialize visual effect."""
        self.scene_id = scene_id
        self.effect_type = effect_type
        self.parameters = parameters
        self.start_time = start_time
        self.duration = duration

    def to_dict(self):
        """Convert visual effect to dictionary."""
        return {
            "id": self.id,
            "scene_id": self.scene_id,
            "effect_type": self.effect_type,
            "parameters": self.parameters,
            "start_time": self.start_time,
            "duration": self.duration,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

    def update_parameters(self, parameters: Dict[str, Any]) -> None:
        """Update effect parameters."""
        self.parameters.update(parameters)
        self.updated_at = datetime.now(timezone.utc)

    def is_active_at(self, time: float) -> bool:
        """Check if effect is active at given time."""
        return self.start_time <= time <= (self.start_time + self.duration)

    def __repr__(self):
        """String representation."""
        return f"<VisualEffect(id={self.id}, type='{self.effect_type}')>"

@event.listens_for(VisualEffect, 'before_insert')
@event.listens_for(VisualEffect, 'before_update')
def validate_visual_effect(mapper, connection, target):
    """Validate visual effect before save."""
    if target.effect_type not in target.VALID_TYPES:
        raise ValueError(f"Invalid effect type. Must be one of: {', '.join(target.VALID_TYPES)}")
    if target.start_time < 0:
        raise ValueError("Start time cannot be negative")
    if target.duration <= 0:
        raise ValueError("Duration must be positive")
