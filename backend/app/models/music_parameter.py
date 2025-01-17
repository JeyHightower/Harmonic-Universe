from app.extensions import db

class MusicParameter(db.Model):
    __tablename__ = 'music_parameters'

    id = db.Column(db.Integer, primary_key=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), nullable=False)

    # Music parameters
    tempo = db.Column(db.Float, nullable=False)
    key = db.Column(db.String(10), nullable=False)
    scale = db.Column(db.String(20), nullable=False)
    volume = db.Column(db.Float, nullable=False)
    waveform = db.Column(db.String(20), nullable=False)
    harmonics = db.Column(db.JSON, nullable=False)
    reverb = db.Column(db.Float, nullable=False)
    delay = db.Column(db.Float, nullable=False)
    filter_freq = db.Column(db.Float, nullable=False)
    filter_resonance = db.Column(db.Float, nullable=False)
    sequence_pattern = db.Column(db.JSON)
    sequence_length = db.Column(db.Integer, nullable=False)

    # Timestamps
    created_at = db.Column(db.DateTime, nullable=True)
    updated_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    universe = db.relationship('Universe', back_populates='music_parameters')

    def __repr__(self):
        return f'<MusicParameter {self.id} for Universe {self.universe_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'universe_id': self.universe_id,
            'tempo': self.tempo,
            'key': self.key,
            'scale': self.scale,
            'volume': self.volume,
            'waveform': self.waveform,
            'harmonics': self.harmonics,
            'reverb': self.reverb,
            'delay': self.delay,
            'filter_freq': self.filter_freq,
            'filter_resonance': self.filter_resonance,
            'sequence_pattern': self.sequence_pattern,
            'sequence_length': self.sequence_length,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
