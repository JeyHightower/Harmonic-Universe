"""Universe model."""
from typing import Dict, Optional
from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..base import BaseModel
from ...db.database import Base


class Universe(BaseModel):
    """
    Universe model - represents a creative universe that contains multiple scenes.
    """

    __tablename__ = "universes"

    # Basic information
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    image_url = Column(String(1024), nullable=True)

    # Additional metadata
    theme = Column(String(100), nullable=True)
    genre = Column(String(100), nullable=True)
    is_public = Column(Boolean, default=False)

    # User relationship (owner)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="universes")

    # Relationship to scenes
    scenes = relationship(
        "Scene", back_populates="universe", cascade="all, delete-orphan"
    )

    # Universe-wide parameters
    physics_params = Column(
        JSONB,
        default=lambda: {
            "gravity": {"value": 9.81, "unit": "m/s²", "min": 0, "max": 20},
            "air_resistance": {"value": 0.0, "unit": "kg/m³", "min": 0, "max": 1},
            "elasticity": {"value": 1.0, "unit": "coefficient", "min": 0, "max": 1},
            "friction": {"value": 0.1, "unit": "coefficient", "min": 0, "max": 1},
            "temperature": {"value": 293.15, "unit": "K", "min": 0, "max": 1000},
            "pressure": {"value": 101.325, "unit": "kPa", "min": 0, "max": 200},
        },
    )

    harmony_params = Column(
        JSONB,
        default=lambda: {
            "resonance": {"value": 1.0, "min": 0, "max": 1},
            "dissonance": {"value": 0.0, "min": 0, "max": 1},
            "harmony_scale": {"value": 1.0, "min": 0, "max": 2},
            "key": {
                "value": "C",
                "options": [
                    "C",
                    "G",
                    "D",
                    "A",
                    "E",
                    "B",
                    "F#",
                    "C#",
                    "F",
                    "Bb",
                    "Eb",
                    "Ab",
                ],
            },
            "scale": {
                "value": "major",
                "options": [
                    "major",
                    "minor",
                    "harmonic_minor",
                    "melodic_minor",
                    "pentatonic",
                ],
            },
            "tempo": {"value": 120, "unit": "bpm", "min": 60, "max": 200},
            "instruments": {
                "primary": "piano",
                "secondary": ["strings", "pad"],
                "options": ["piano", "strings", "pad", "bass", "drums", "synth"],
            },
        },
    )

    story_points = Column(
        JSONB,
        default=lambda: {
            "points": [],
            "current_page": 1,
            "items_per_page": 10,
            "total_pages": 1,
            "metadata": {"total_points": 0, "last_modified": None},
        },
    )

    visualization_params = Column(
        JSONB,
        default=lambda: {
            "color_scheme": "default",
            "particle_density": 1.0,
            "render_quality": "medium",
            "effects": {"bloom": True, "motion_blur": False, "ambient_occlusion": True},
            "camera": {"fov": 75, "near": 0.1, "far": 1000},
        },
    )

    ai_params = Column(
        JSONB,
        default=lambda: {
            "enabled": True,
            "optimization_target": "harmony",
            "learning_rate": 0.001,
            "update_frequency": "realtime",
            "constraints": {"min_harmony": 0.2, "max_complexity": 0.8},
        },
    )

    # Relationships
    physics_objects = relationship(
        "PhysicsObject", back_populates="universe", cascade="all, delete-orphan"
    )
    audio_tracks = relationship(
        "AudioTrack", back_populates="universe", cascade="all, delete-orphan"
    )

    @classmethod
    def get_by_id(cls, db, universe_id):
        """Get a universe by ID.

        Args:
            db: Database session
            universe_id: Universe ID

        Returns:
            Universe object or None if not found
        """
        return db.query(cls).filter(cls.id == universe_id).first()

    def to_dict(self):
        """Convert the universe object to a dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "image_url": self.image_url,
            "theme": self.theme,
            "genre": self.genre,
            "is_public": self.is_public,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "scene_count": len(self.scenes) if self.scenes else 0,
        }

    def to_dict_with_scenes(self):
        """Convert the universe object to a dictionary including scene information"""
        universe_dict = self.to_dict()
        universe_dict["scenes"] = [scene.to_dict() for scene in self.scenes]
        return universe_dict
