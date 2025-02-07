from app import db
from .base import BaseModel

class Project(BaseModel):
    __tablename__ = 'projects'

    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    is_public = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Relationships
    user = db.relationship('User', back_populates='projects')
    audio_files = db.relationship('AudioFile', back_populates='project', cascade='all, delete-orphan')
    visualizations = db.relationship('Visualization', back_populates='project', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'is_public': self.is_public,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'audio_files': [audio.to_dict() for audio in self.audio_files],
            'visualizations': [viz.to_dict() for viz in self.visualizations]
        }

    def __repr__(self):
        return f'<Project {self.title}>'
