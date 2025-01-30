"""Media effects models module."""
from sqlalchemy import Integer, String, ForeignKey, JSON
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import Optional, Dict, Any
from .base_models import BaseModel, TimestampMixin
from .scene import Scene


class VisualEffect(BaseModel, TimestampMixin):
    """Visual effect model for scenes."""

    __tablename__ = 'visual_effects'

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    effect_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    parameters: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        default=dict
    )
    scene_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey('scenes.id', ondelete='CASCADE'),
        nullable=False
    )

    # Relationships with type hints
    scene: Mapped["Scene"] = relationship(
        "Scene",
        back_populates="visual_effects"
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert visual effect to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'effect_type': self.effect_type,
            'parameters': self.parameters,
            'scene_id': self.scene_id,
            'created_at': (
                self.created_at.isoformat() if self.created_at else None
            ),
            'updated_at': (
                self.updated_at.isoformat() if self.updated_at else None
            )
        }


class AudioTrack(BaseModel, TimestampMixin):
    """Audio track model for scenes."""

    __tablename__ = 'audio_tracks'

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    track_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )  # e.g., background, effect, voice
    file_path: Mapped[Optional[str]] = mapped_column(
        String(255)
    )
    parameters: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        default=dict
    )
    scene_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey('scenes.id', ondelete='CASCADE'),
        nullable=False
    )

    # Relationships with type hints
    scene: Mapped["Scene"] = relationship(
        "Scene",
        back_populates="audio_tracks"
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert audio track to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'track_type': self.track_type,
            'file_path': self.file_path,
            'parameters': self.parameters,
            'scene_id': self.scene_id,
            'created_at': (
                self.created_at.isoformat() if self.created_at else None
            ),
            'updated_at': (
                self.updated_at.isoformat() if self.updated_at else None
            )
        }
