from sqlalchemy import Column, String, Float, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.core.base import BaseModel

class AudioFile(BaseModel):
    __tablename__ = 'audio_files'

    filename = Column(String(255), nullable=False)
    file_path = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    duration = Column(Float)
    sample_rate = Column(Integer)
    channels = Column(Integer)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=False)

    # Relationships
    user = relationship('User', back_populates='audio_files')
    project = relationship('Project', back_populates='audio_files')
    visualizations = relationship('Visualization', back_populates='audio_file', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'file_type': self.file_type,
            'duration': self.duration,
            'sample_rate': self.sample_rate,
            'channels': self.channels,
            'user_id': self.user_id,
            'project_id': self.project_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def __repr__(self):
        return f'<AudioFile {self.filename}>'
