from sqlalchemy import Column, String, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..base import BaseModel

class Visualization(BaseModel):
    __tablename__ = 'visualizations'

    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # particle_system, waveform, spectrum
    settings = Column(JSON)  # Store visualization settings
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    universe_id = Column(UUID(as_uuid=True), ForeignKey('universes.id', ondelete='CASCADE'), nullable=True)
    scene_id = Column(UUID(as_uuid=True), ForeignKey('scenes.id', ondelete='CASCADE'), nullable=False)

    # Relationships
    user = relationship('User', back_populates='visualizations')
    universe = relationship('Universe', back_populates='visualizations')
    scene = relationship('Scene', back_populates='visualizations')

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'type': self.type,
            'settings': self.settings,
            'user_id': str(self.user_id),
            'universe_id': str(self.universe_id) if self.universe_id else None,
            'scene_id': str(self.scene_id),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def __repr__(self):
        return f'<Visualization {self.name}>'
