from app import db
from app.models.core.base import BaseModel

class AudioFile(BaseModel):
    __tablename__ = 'audio_files'

    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)
    duration = db.Column(db.Float)
    sample_rate = db.Column(db.Integer)
    channels = db.Column(db.Integer)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)

    # Relationships
    user = db.relationship('User', back_populates='audio_files')
    project = db.relationship('Project', back_populates='audio_files')
    visualizations = db.relationship('Visualization', back_populates='audio_file', cascade='all, delete-orphan')

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
