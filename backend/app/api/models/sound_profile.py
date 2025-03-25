from app import db
from datetime import datetime

class SoundProfile(db.Model):
    __tablename__ = 'sound_profiles'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    base_key = db.Column(db.String(20))  # Base musical key
    dominant_scale = db.Column(db.String(50))  # Dominant scale type
    mood_palette = db.Column(db.String(255))  # Comma-separated mood keywords
    tempo_range = db.Column(db.String(50))  # Range of tempos (e.g., "60-120" BPM)
    instrumentation = db.Column(db.Text)  # Typical instruments used
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    universes = db.relationship('Universe', back_populates='sound_profile', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'base_key': self.base_key,
            'dominant_scale': self.dominant_scale,
            'mood_palette': self.mood_palette,
            'tempo_range': self.tempo_range,
            'instrumentation': self.instrumentation,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 