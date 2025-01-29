"""AudioTrack model."""
from datetime import datetime, timezone
from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, event
from ..extensions import db
from typing import Dict, Any

class AudioTrack(db.Model):
    """AudioTrack model for storing audio track related details."""

    __tablename__ = "audio_tracks"
    __table_args__ = (
        db.Index("idx_scene_id", "scene_id"),
        db.Index("idx_track_type", "track_type"),
    )

    # Track type constants
    TYPE_PROCEDURAL = 'procedural'
    TYPE_AMBIENT = 'ambient'
    TYPE_EFFECT = 'effect'
    TYPE_MUSIC = 'music'

    VALID_TYPES = [TYPE_PROCEDURAL, TYPE_AMBIENT, TYPE_EFFECT, TYPE_MUSIC]

    id = Column(Integer, primary_key=True)
    scene_id = Column(Integer, ForeignKey("scenes.id", ondelete="CASCADE"), nullable=False)
    track_type = Column(String(50), nullable=False)
    parameters = Column(JSON, nullable=False)
    start_time = Column(Float, nullable=False)
    duration = Column(Float, nullable=False)
    volume = Column(Float, nullable=False, default=1.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    scene = relationship("Scene", back_populates="audio_tracks")

    def __init__(self, scene_id, track_type, parameters, start_time, duration, volume=1.0):
        """Initialize audio track."""
        self.scene_id = scene_id
        self.track_type = track_type
        self.parameters = parameters
        self.start_time = start_time
        self.duration = duration
        self.volume = volume

    def to_dict(self):
        """Convert audio track to dictionary."""
        return {
            "id": self.id,
            "scene_id": self.scene_id,
            "track_type": self.track_type,
            "parameters": self.parameters,
            "start_time": self.start_time,
            "duration": self.duration,
            "volume": self.volume,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

    def update_parameters(self, parameters: Dict[str, Any]) -> None:
        """Update track parameters."""
        self.parameters.update(parameters)
        self.updated_at = datetime.now(timezone.utc)

    def set_volume(self, volume: float) -> None:
        """Set track volume."""
        if 0 <= volume <= 1:
            self.volume = volume
        else:
            raise ValueError("Volume must be between 0 and 1")

    def is_active_at(self, time: float) -> bool:
        """Check if track is active at given time."""
        return self.start_time <= time <= (self.start_time + self.duration)

    def __repr__(self):
        """String representation."""
        return f"<AudioTrack(id={self.id}, type='{self.track_type}')>"

@event.listens_for(AudioTrack, 'before_insert')
@event.listens_for(AudioTrack, 'before_update')
def validate_audio_track(mapper, connection, target):
    """Validate audio track before save."""
    if target.track_type not in target.VALID_TYPES:
        raise ValueError(f"Invalid track type. Must be one of: {', '.join(target.VALID_TYPES)}")
    if target.start_time < 0:
        raise ValueError("Start time cannot be negative")
    if target.duration <= 0:
        raise ValueError("Duration must be positive")
    if not 0 <= target.volume <= 1:
        raise ValueError("Volume must be between 0 and 1")
