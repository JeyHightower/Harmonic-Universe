"""Universe model."""
from typing import Dict, Optional
from sqlalchemy import Column, String, Boolean, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from ..base import BaseModel

class Universe(BaseModel):
    """Universe model."""

    __tablename__ = "universes"

    name = Column(String(255), nullable=False)
    description = Column(String(1000))
    is_public = Column(Boolean, default=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    version = Column(Integer, default=1)

    # Universe-wide parameters
    physics_params = Column(JSONB, default=lambda: {
        'gravity': {'value': 9.81, 'unit': 'm/s²', 'min': 0, 'max': 20},
        'air_resistance': {'value': 0.0, 'unit': 'kg/m³', 'min': 0, 'max': 1},
        'elasticity': {'value': 1.0, 'unit': 'coefficient', 'min': 0, 'max': 1},
        'friction': {'value': 0.1, 'unit': 'coefficient', 'min': 0, 'max': 1},
        'temperature': {'value': 293.15, 'unit': 'K', 'min': 0, 'max': 1000},
        'pressure': {'value': 101.325, 'unit': 'kPa', 'min': 0, 'max': 200}
    })

    harmony_params = Column(JSONB, default=lambda: {
        'resonance': {'value': 1.0, 'min': 0, 'max': 1},
        'dissonance': {'value': 0.0, 'min': 0, 'max': 1},
        'harmony_scale': {'value': 1.0, 'min': 0, 'max': 2},
        'key': {'value': 'C', 'options': ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab']},
        'scale': {'value': 'major', 'options': ['major', 'minor', 'harmonic_minor', 'melodic_minor', 'pentatonic']},
        'tempo': {'value': 120, 'unit': 'bpm', 'min': 60, 'max': 200},
        'instruments': {
            'primary': 'piano',
            'secondary': ['strings', 'pad'],
            'options': ['piano', 'strings', 'pad', 'bass', 'drums', 'synth']
        }
    })

    story_points = Column(JSONB, default=lambda: {
        'points': [],
        'current_page': 1,
        'items_per_page': 10,
        'total_pages': 1,
        'metadata': {
            'total_points': 0,
            'last_modified': None
        }
    })

    visualization_params = Column(JSONB, default=lambda: {
        'color_scheme': 'default',
        'particle_density': 1.0,
        'render_quality': 'medium',
        'effects': {
            'bloom': True,
            'motion_blur': False,
            'ambient_occlusion': True
        },
        'camera': {
            'fov': 75,
            'near': 0.1,
            'far': 1000
        }
    })

    ai_params = Column(JSONB, default=lambda: {
        'enabled': True,
        'optimization_target': 'harmony',
        'learning_rate': 0.001,
        'update_frequency': 'realtime',
        'constraints': {
            'min_harmony': 0.2,
            'max_complexity': 0.8
        }
    })

    # Relationships
    user = relationship("User", back_populates="universes")
    scenes = relationship("Scene", back_populates="universe", cascade="all, delete-orphan")
    physics_objects = relationship("PhysicsObject", back_populates="universe", cascade="all, delete-orphan")
    audio_tracks = relationship("AudioTrack", back_populates="universe", cascade="all, delete-orphan")

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "is_public": self.is_public,
            "user_id": self.user_id,
            "version": self.version,
            "physics_params": self.physics_params,
            "harmony_params": self.harmony_params,
            "story_points": self.story_points,
            "visualization_params": self.visualization_params,
            "ai_params": self.ai_params,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
