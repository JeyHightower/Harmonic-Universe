from datetime import datetime
from ..database import db
from .base import BaseModel

class MusicPiece(BaseModel):
    __tablename__ = 'music_pieces'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    file_path = db.Column(db.String(255))
    duration = db.Column(db.Float)  # Duration in seconds
    tempo = db.Column(db.Integer)   # BPM
    key = db.Column(db.String(20))  # Musical key (e.g., C Major, A Minor)
    
    # Relationships
    creator = db.relationship('User', backref=db.backref('music_pieces', lazy=True))
    scenes = db.relationship('Scene', backref=db.backref('music_piece', lazy=True))
    harmonies = db.relationship('Harmony', backref=db.backref('music_piece', lazy=True))
    audio_samples = db.relationship('AudioSample', secondary='music_audio_samples', backref=db.backref('music_pieces', lazy=True))
    
    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'creator_id': self.creator_id,
            'file_path': self.file_path,
            'duration': self.duration,
            'tempo': self.tempo,
            'key': self.key
        })
        return base_dict 