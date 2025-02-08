from app import db
from app.models.core.base import BaseModel

class Visualization(BaseModel):
    __tablename__ = 'visualizations'

    title = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # waveform, spectrogram, 3d, etc.
    settings = db.Column(db.JSON)  # Store visualization settings
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    audio_file_id = db.Column(db.Integer, db.ForeignKey('audio_files.id'), nullable=False)

    # Relationships
    user = db.relationship('User', back_populates='visualizations')
    project = db.relationship('Project', back_populates='visualizations')
    audio_file = db.relationship('AudioFile', back_populates='visualizations')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'type': self.type,
            'settings': self.settings,
            'user_id': self.user_id,
            'project_id': self.project_id,
            'audio_file_id': self.audio_file_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def __repr__(self):
        return f'<Visualization {self.title}>'
