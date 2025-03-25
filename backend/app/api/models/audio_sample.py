from datetime import datetime
from ..database import db
from .base import BaseModel

class AudioSample(BaseModel):
    __tablename__ = 'audio_samples'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    file_path = db.Column(db.String(255), nullable=False)
    duration = db.Column(db.Float)  # Duration in seconds
    format = db.Column(db.String(10))  # File format (e.g., mp3, wav)
    sample_rate = db.Column(db.Integer)  # Sample rate in Hz
    uploader_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Relationships
    uploader = db.relationship('User', backref=db.backref('audio_samples', lazy=True))
    music_pieces = db.relationship('MusicPiece', secondary='music_audio_samples', backref=db.backref('audio_samples', lazy=True))
    
    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'file_path': self.file_path,
            'duration': self.duration,
            'format': self.format,
            'sample_rate': self.sample_rate,
            'uploader_id': self.uploader_id
        })
        return base_dict 