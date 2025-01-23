from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, ForeignKey, event, DateTime
from sqlalchemy.orm import relationship
from app.extensions import db

class MusicParameters(db.Model):
    __tablename__ = 'music_parameters'

    id = Column(Integer, primary_key=True)
    universe_id = Column(Integer, ForeignKey('universes.id', ondelete='CASCADE'), nullable=False)
    tempo = Column(Float, nullable=False, default=120.0)  # BPM
    key = Column(String(10), nullable=False, default='C')  # Musical key
    scale = Column(String(20), nullable=False, default='major')  # Musical scale
    harmony = Column(Float, nullable=False, default=0.5)  # Harmony level (0-1)
    rhythm_complexity = Column(Float, nullable=False, default=0.5)  # Rhythm complexity (0-1)
    melody_range = Column(Float, nullable=False, default=0.5)  # Melody range (0-1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    universe = relationship('Universe', back_populates='music_parameters', uselist=False)

    # Valid musical keys and scales
    VALID_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb']
    VALID_SCALES = ['major', 'minor', 'harmonic minor', 'melodic minor', 'pentatonic', 'blues']

    def validate(self):
        """Validate music parameters."""
        # Set default values for nullable fields
        if self.tempo is None:
            self.tempo = 120.0
        if self.harmony is None:
            self.harmony = 0.5
        if self.rhythm_complexity is None:
            self.rhythm_complexity = 0.5
        if self.melody_range is None:
            self.melody_range = 0.5

        # Validate tempo (40-240 BPM is a reasonable range)
        if not 40 <= self.tempo <= 240:
            raise ValueError("Tempo must be between 40 and 240 BPM")

        # Validate harmony, rhythm_complexity, and melody_range (0-1)
        for param, name in [(self.harmony, 'Harmony'),
                          (self.rhythm_complexity, 'Rhythm complexity'),
                          (self.melody_range, 'Melody range')]:
            if not 0 <= param <= 1:
                raise ValueError(f"{name} must be between 0 and 1")

        # Validate musical key
        if self.key not in self.VALID_KEYS:
            raise ValueError(f"Invalid musical key. Must be one of: {', '.join(self.VALID_KEYS)}")

        # Validate scale
        if self.scale not in self.VALID_SCALES:
            raise ValueError(f"Invalid scale. Must be one of: {', '.join(self.VALID_SCALES)}")

    def __repr__(self):
        return f'<MusicParameters for Universe {self.universe_id}>'

    def to_dict(self):
        """Convert the parameters to a dictionary."""
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
        self.validate()

@event.listens_for(MusicParameters, 'before_insert')
@event.listens_for(MusicParameters, 'before_update')
def validate_music_parameters(mapper, connection, target):
    """Validate music parameters before insert or update."""
    target.validate()
