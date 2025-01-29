"""Scene model."""
from datetime import datetime, timezone
from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from ..extensions import db
from typing import Dict, Any

class Scene(db.Model):
    """Scene model for storing scene related details."""

    __tablename__ = "scenes"
    __table_args__ = (
        db.Index("idx_storyboard_id", "storyboard_id"),
        db.Index("idx_sequence", "sequence"),
    )

    id = Column(Integer, primary_key=True)
    storyboard_id = Column(Integer, ForeignKey("storyboards.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    sequence = Column(Integer, nullable=False)
    content = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    visual_effects = relationship(
        "VisualEffect",
        backref="scene",
        lazy="dynamic",
        cascade="all, delete-orphan"
    )

    audio_tracks = relationship(
        "AudioTrack",
        backref="scene",
        lazy="dynamic",
        cascade="all, delete-orphan"
    )

    def __init__(self, storyboard_id, title, sequence, content):
        """Initialize scene."""
        self.storyboard_id = storyboard_id
        self.title = title
        self.sequence = sequence
        self.content = content

    def to_dict(self):
        """Convert scene to dictionary."""
        return {
            "id": self.id,
            "storyboard_id": self.storyboard_id,
            "title": self.title,
            "sequence": self.sequence,
            "content": self.content,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "visual_effects": [effect.to_dict() for effect in self.visual_effects],
            "audio_tracks": [track.to_dict() for track in self.audio_tracks]
        }

    def update_content(self, content: Dict[str, Any]) -> None:
        """Update scene content."""
        self.content.update(content)
        self.updated_at = datetime.now(timezone.utc)

    def add_visual_effect(
        self,
        effect_type: str,
        parameters: Dict[str, Any],
        start_time: float,
        duration: float
    ) -> 'VisualEffect':
        """Add a visual effect to the scene."""
        effect = VisualEffect(
            scene_id=self.id,
            effect_type=effect_type,
            parameters=parameters,
            start_time=start_time,
            duration=duration
        )
        self.visual_effects.append(effect)
        return effect

    def add_audio_track(
        self,
        track_type: str,
        parameters: Dict[str, Any],
        start_time: float,
        duration: float
    ) -> 'AudioTrack':
        """Add an audio track to the scene."""
        track = AudioTrack(
            scene_id=self.id,
            track_type=track_type,
            parameters=parameters,
            start_time=start_time,
            duration=duration
        )
        self.audio_tracks.append(track)
        return track

    def __repr__(self):
        """String representation."""
        return f"<Scene(id={self.id}, title='{self.title}', sequence={self.sequence})>"
