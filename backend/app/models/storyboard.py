from datetime import datetime
from app.extensions import db

class StoryboardPoint(db.Model):
    __tablename__ = 'storyboard_points'

    id = db.Column(db.Integer, primary_key=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    timestamp = db.Column(db.Float, nullable=False)  # Position in the timeline (seconds)
    harmony_value = db.Column(db.Float, default=0.5)  # 0.0 to 1.0
    transition_duration = db.Column(db.Float, default=1.0)  # Duration of transition to next point
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Physics state at this point
    gravity = db.Column(db.Float)
    friction = db.Column(db.Float)
    elasticity = db.Column(db.Float)
    air_resistance = db.Column(db.Float)
    density = db.Column(db.Float)

    # Audio state at this point
    waveform = db.Column(db.String(20))
    attack = db.Column(db.Float)
    decay = db.Column(db.Float)
    sustain = db.Column(db.Float)
    release = db.Column(db.Float)
    lfo_rate = db.Column(db.Float)
    lfo_depth = db.Column(db.Float)

    # Relationships
    universe = db.relationship('Universe', back_populates='storyboard_points')

    def __repr__(self):
        return f'<StoryboardPoint {self.title} at {self.timestamp}s>'

    def to_dict(self):
        return {
            'id': self.id,
            'universe_id': self.universe_id,
            'title': self.title,
            'description': self.description,
            'timestamp': self.timestamp,
            'harmony_value': self.harmony_value,
            'transition_duration': self.transition_duration,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'physics_state': {
                'gravity': self.gravity,
                'friction': self.friction,
                'elasticity': self.elasticity,
                'air_resistance': self.air_resistance,
                'density': self.density
            },
            'audio_state': {
                'waveform': self.waveform,
                'attack': self.attack,
                'decay': self.decay,
                'sustain': self.sustain,
                'release': self.release,
                'lfo_rate': self.lfo_rate,
                'lfo_depth': self.lfo_depth
            }
        }
