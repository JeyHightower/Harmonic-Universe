from app import db
from datetime import datetime

class AudioSample(db.Model):
    __tablename__ = 'audio_samples'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    file_path = db.Column(db.String(255), nullable=False)
    duration = db.Column(db.Float)  # Duration in seconds
    format = db.Column(db.String(10))  # File format (e.g., mp3, wav)
    sample_rate = db.Column(db.Integer)  # Sample rate in Hz
    uploader_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    uploader = db.relationship('User', back_populates='audio_samples')
    music_pieces = db.relationship('MusicPiece', secondary='music_audio_samples', back_populates='audio_samples')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'file_path': self.file_path,
            'duration': self.duration,
            'format': self.format,
            'sample_rate': self.sample_rate,
            'uploader_id': self.uploader_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 