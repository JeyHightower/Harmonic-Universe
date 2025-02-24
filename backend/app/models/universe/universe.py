from sqlalchemy import Column, Boolean, JSON, String, ForeignKey, Float, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from ..base import BaseModel
from typing import Dict, List, Optional
import json
from flask_jwt_extended import get_jwt_identity

class Universe(BaseModel):
    """Universe model for managing audio-visual experiences."""
    __tablename__ = 'universes'

    name = Column(String(255), nullable=False)
    description = Column(String(1000))
    is_public = Column(Boolean, default=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    version = Column(Integer, default=1)  # For tracking universe versions

    # Physics parameters with expanded configuration
    physics_params = Column(JSONB, default=lambda: {
        'gravity': {
            'value': 9.81,
            'unit': 'm/s²',
            'min': 0,
            'max': 20
        },
        'air_resistance': {
            'value': 0.0,
            'unit': 'kg/m³',
            'min': 0,
            'max': 1
        },
        'elasticity': {
            'value': 1.0,
            'unit': 'coefficient',
            'min': 0,
            'max': 1
        },
        'friction': {
            'value': 0.1,
            'unit': 'coefficient',
            'min': 0,
            'max': 1
        },
        'temperature': {
            'value': 293.15,
            'unit': 'K',
            'min': 0,
            'max': 1000
        },
        'pressure': {
            'value': 101.325,
            'unit': 'kPa',
            'min': 0,
            'max': 200
        }
    })

    # Harmony parameters with music generation settings
    harmony_params = Column(JSONB, default=lambda: {
        'resonance': {
            'value': 1.0,
            'min': 0,
            'max': 1
        },
        'dissonance': {
            'value': 0.0,
            'min': 0,
            'max': 1
        },
        'harmony_scale': {
            'value': 1.0,
            'min': 0,
            'max': 2
        },
        'balance': {
            'value': 0.5,
            'min': 0,
            'max': 1
        },
        'tempo': {
            'value': 120,
            'unit': 'bpm',
            'min': 60,
            'max': 200
        },
        'key': {
            'value': 'C',
            'options': ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab']
        },
        'scale': {
            'value': 'major',
            'options': ['major', 'minor', 'harmonic_minor', 'melodic_minor', 'pentatonic']
        },
        'instruments': {
            'primary': 'piano',
            'secondary': ['strings', 'pad'],
            'options': ['piano', 'strings', 'pad', 'bass', 'drums', 'synth']
        }
    })

    # Story points with enhanced structure
    story_points = Column(JSONB, default=lambda: {
        'points': [],
        'current_page': 1,
        'items_per_page': 10,
        'total_pages': 1,
        'metadata': {
            'last_modified': None,
            'total_points': 0
        }
    })

    # Visualization settings
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

    # AI settings
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
    user = relationship(
        'User',
        back_populates='universes',
        primaryjoin='Universe.user_id == User.id'
    )
    scenes = relationship('Scene', back_populates='universe', cascade='all, delete-orphan')
    visualizations = relationship('Visualization', back_populates='universe', cascade='all, delete-orphan')

    @classmethod
    def get_by_id(cls, db, universe_id):
        """Get universe by ID."""
        return db.query(cls).filter(cls.id == universe_id).first()

    def to_dict(self):
        """Convert universe to dictionary with all parameters."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_public': self.is_public,
            'version': self.version,
            'physics_params': self.physics_params,
            'harmony_params': self.harmony_params,
            'story_points': self.story_points,
            'visualization_params': self.visualization_params,
            'ai_params': self.ai_params,
            'user_id': self.user_id,
            'user_role': 'owner' if self.user_id == get_jwt_identity() else 'viewer',
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def update_physics(self, params: Dict) -> 'Universe':
        """Update physics parameters with validation."""
        for key, value in params.items():
            if key in self.physics_params:
                if isinstance(value, dict):
                    self.physics_params[key].update(value)
                else:
                    self.physics_params[key]['value'] = value
        return self

    def update_harmony(self, params: Dict) -> 'Universe':
        """Update harmony parameters with validation."""
        for key, value in params.items():
            if key in self.harmony_params:
                if isinstance(value, dict):
                    self.harmony_params[key].update(value)
                else:
                    self.harmony_params[key]['value'] = value
        return self

    def add_story_point(self, story_point: Dict) -> 'Universe':
        """Add a story point with metadata."""
        if not self.story_points.get('points'):
            self.story_points['points'] = []

        story_point['id'] = len(self.story_points['points']) + 1
        story_point['created_at'] = self.created_at.isoformat()
        self.story_points['points'].append(story_point)

        # Update metadata
        self.story_points['metadata']['total_points'] = len(self.story_points['points'])
        self.story_points['metadata']['last_modified'] = self.updated_at.isoformat()
        self._update_pagination()
        return self

    def remove_story_point(self, story_point_id: int) -> 'Universe':
        """Remove a story point and update metadata."""
        self.story_points['points'] = [
            sp for sp in self.story_points['points']
            if sp.get('id') != story_point_id
        ]
        self._update_pagination()
        return self

    def _update_pagination(self):
        """Update story points pagination metadata."""
        total_points = len(self.story_points['points'])
        items_per_page = self.story_points['items_per_page']
        self.story_points['total_pages'] = max(1, (total_points + items_per_page - 1) // items_per_page)
        self.story_points['current_page'] = min(
            self.story_points['current_page'],
            self.story_points['total_pages']
        )

    def get_story_points_page(self, page: int) -> List[Dict]:
        """Get paginated story points."""
        items_per_page = self.story_points['items_per_page']
        start_idx = (page - 1) * items_per_page
        end_idx = start_idx + items_per_page
        return self.story_points['points'][start_idx:end_idx]

    def update_visualization(self, params: Dict) -> 'Universe':
        """Update visualization parameters."""
        self.visualization_params.update(params)
        return self

    def update_ai_settings(self, params: Dict) -> 'Universe':
        """Update AI parameters."""
        self.ai_params.update(params)
        return self

    def __repr__(self):
        return f'<Universe {self.name} v{self.version}>'
