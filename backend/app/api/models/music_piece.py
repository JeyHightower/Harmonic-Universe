from app import db
from datetime import datetime

class MusicPiece(db.Model):
    __tablename__ = 'music_pieces'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    file_path = db.Column(db.String(255))
    duration = db.Column(db.Float)  # Duration in seconds
    tempo = db.Column(db.Integer)   # BPM
    key = db.Column(db.String(20))  # Musical key (e.g., C Major, A Minor)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = db.relationship('User', back_populates='music_pieces')
    scenes = db.relationship('Scene', back_populates='music_piece', lazy=True)
    harmonies = db.relationship('Harmony', back_populates='music_piece', lazy=True)
    audio_samples = db.relationship('AudioSample', secondary='music_audio_samples', back_populates='music_pieces')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'creator_id': self.creator_id,
            'file_path': self.file_path,
            'duration': self.duration,
            'tempo': self.tempo,
            'key': self.key,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 