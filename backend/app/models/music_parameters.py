from datetime import datetime
from app.extensions import db

class MusicParameters(db.Model):
    __tablename__ = 'music_parameters'

    id = db.Column(db.Integer, primary_key=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), nullable=False)
    tempo = db.Column(db.Float, nullable=False, default=120.0)  # BPM
    key = db.Column(db.String(10), nullable=False, default='C')  # Musical key
    scale = db.Column(db.String(20), nullable=False, default='major')  # Musical scale
    harmony = db.Column(db.Float, nullable=False, default=0.5)  # Harmony level (0-1)
    rhythm_complexity = db.Column(db.Float, nullable=False, default=0.5)  # Rhythm complexity (0-1)
    melody_range = db.Column(db.Float, nullable=False, default=0.5)  # Melody range (0-1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    universe = db.relationship('Universe', back_populates='music_parameters', uselist=False)

    def __repr__(self):
        return f'<MusicParameters for Universe {self.universe_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'universe_id': self.universe_id,
            'tempo': self.tempo,
            'key': self.key,
            'scale': self.scale,
            'harmony': self.harmony,
            'rhythm_complexity': self.rhythm_complexity,
            'melody_range': self.melody_range,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def update(self, data):
        """Update the parameters with new values."""
        for key, value in data.items():
            if hasattr(self, key):
                setattr(self, key, value)
