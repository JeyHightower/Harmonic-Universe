from sqlalchemy import Column, String, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..base import BaseModel

class Visualization(BaseModel):
    __tablename__ = 'visualizations'

    title = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # waveform, spectrogram, 3d, etc.
    settings = Column(JSON)  # Store visualization settings
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=False)
    audio_file_id = Column(UUID(as_uuid=True), ForeignKey('audio_files.id'), nullable=False)
    universe_id = Column(UUID(as_uuid=True), ForeignKey('universes.id', ondelete='CASCADE'), nullable=True)

    # Relationships
    user = relationship('User', back_populates='visualizations')
    project = relationship('Project', back_populates='visualizations')
    audio_file = relationship('AudioFile', back_populates='visualizations')
    universe = relationship('Universe', back_populates='visualizations')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'type': self.type,
            'settings': self.settings,
            'user_id': self.user_id,
            'project_id': self.project_id,
            'audio_file_id': self.audio_file_id,
            'universe_id': self.universe_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def __repr__(self):
        return f'<Visualization {self.title}>'
