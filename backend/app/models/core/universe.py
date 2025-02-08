from sqlalchemy import Column, Boolean, JSON, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel

class Universe(BaseModel):
    """Universe model for managing audio-visual experiences."""
    __tablename__ = 'universes'

    name = Column(String(255), nullable=False)
    description = Column(String(1000))
    is_public = Column(Boolean, default=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)

    # Physics parameters
    physics_params = Column(JSON, default=lambda: {
        'gravity': 9.81,
        'air_resistance': 0.0,
        'elasticity': 1.0,
        'friction': 0.1
    })

    # Harmony parameters
    harmony_params = Column(JSON, default=lambda: {
        'resonance': 1.0,
        'dissonance': 0.0,
        'harmony_scale': 1.0,
        'balance': 0.5
    })

    # Story points
    story_points = Column(JSON, default=list)

    # Relationships
    user = relationship('User', back_populates='universes')
    scenes = relationship('Scene', back_populates='universe', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_public': self.is_public,
            'physics_params': self.physics_params,
            'harmony_params': self.harmony_params,
            'story_points': self.story_points,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def update_physics(self, params):
        """Update physics parameters."""
        self.physics_params.update(params)
        return self

    def update_harmony(self, params):
        """Update harmony parameters."""
        self.harmony_params.update(params)
        return self

    def add_story_point(self, story_point):
        """Add a story point."""
        if not self.story_points:
            self.story_points = []
        self.story_points.append(story_point)
        return self

    def remove_story_point(self, story_point_id):
        """Remove a story point by ID."""
        self.story_points = [sp for sp in self.story_points if sp.get('id') != story_point_id]
        return self

    def __repr__(self):
        return f'<Universe {self.name}>'
