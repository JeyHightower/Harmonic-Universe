from app import db
from .base import BaseModel
from sqlalchemy.dialects.postgresql import JSON
import json
import numpy as np
from typing import Dict, Any

class Universe(BaseModel):
    __tablename__ = 'universes'

    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    is_public = db.Column(db.Boolean, default=False)

    # Physics parameters
    physics_params = db.Column(JSON, default={
        'gravity': 9.81,
        'friction': 0.5,
        'elasticity': 0.7,
        'air_resistance': 0.1,
        'time_dilation': 1.0
    })

    # Music parameters
    harmony_params = db.Column(JSON, default={
        'base_frequency': 440,  # A4 note
        'scale': 'major',
        'tempo': 120,
        'volume': 0.7
    })

    # Story elements
    story_points = db.Column(JSON, default=[])

    # Relationships
    user = db.relationship('User', back_populates='universes')

    def update_physics(self, parameters: Dict[str, float]) -> None:
        """Update physics parameters and recalculate harmony."""
        self.physics_params.update(parameters)
        db.session.commit()

    def calculate_harmony(self, physics_params: Dict[str, float]) -> Dict[str, Any]:
        """Calculate harmony parameters based on physics state."""
        # Base frequency modulation based on gravity
        gravity_factor = physics_params.get('gravity', 9.81) / 9.81
        base_freq = self.harmony_params['base_frequency'] * gravity_factor

        # Tempo modulation based on time dilation
        time_dilation = physics_params.get('time_dilation', 1.0)
        tempo = self.harmony_params['tempo'] / time_dilation

        # Scale selection based on overall energy
        energy = sum(physics_params.values()) / len(physics_params)
        scales = ['minor', 'major', 'lydian', 'mixolydian']
        scale_index = int(np.clip(energy * len(scales), 0, len(scales) - 1))

        return {
            'frequency': base_freq,
            'tempo': tempo,
            'scale': scales[scale_index],
            'volume': self.harmony_params['volume']
        }

    def update_story(self, story_point: Dict[str, Any]) -> None:
        """Add or update a story point."""
        if not isinstance(self.story_points, list):
            self.story_points = []

        # Add timestamp if not present
        if 'timestamp' not in story_point:
            story_point['timestamp'] = datetime.utcnow().isoformat()

        self.story_points.append(story_point)
        db.session.commit()

    def export_to_json(self) -> str:
        """Export universe parameters to JSON."""
        return json.dumps({
            'name': self.name,
            'description': self.description,
            'physics_params': self.physics_params,
            'harmony_params': self.harmony_params,
            'story_points': self.story_points
        }, indent=2)

    def export_audio(self) -> str:
        """Export current harmony state as audio file."""
        # This would integrate with your audio generation system
        # For now, return a placeholder
        return f"/api/v1/universes/{self.id}/audio"

    def to_dict(self) -> Dict[str, Any]:
        """Convert universe to dictionary representation."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'user_id': self.user_id,
            'is_public': self.is_public,
            'physics_params': self.physics_params,
            'harmony_params': self.harmony_params,
            'story_points': self.story_points,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
