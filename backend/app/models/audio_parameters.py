from app.extensions import db

class AudioParameters(db.Model):
    __tablename__ = 'audio_parameters'

    id = db.Column(db.Integer, primary_key=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)

    # Synthesis Parameters
    waveform = db.Column(db.String(20), default='sine')  # sine, square, sawtooth, triangle
    attack = db.Column(db.Float, default=0.1)
    decay = db.Column(db.Float, default=0.2)
    sustain = db.Column(db.Float, default=0.7)
    release = db.Column(db.Float, default=0.3)

    # Modulation
    lfo_rate = db.Column(db.Float, default=1.0)
    lfo_depth = db.Column(db.Float, default=0.5)
    filter_cutoff = db.Column(db.Float, default=1000.0)
    filter_resonance = db.Column(db.Float, default=0.5)

    # Effects
    reverb_amount = db.Column(db.Float, default=0.3)
    delay_time = db.Column(db.Float, default=0.3)
    delay_feedback = db.Column(db.Float, default=0.3)

    # Relationships
    universe = db.relationship('Universe', back_populates='audio_parameters', uselist=False)

    def __repr__(self):
        return f'<AudioParameters {self.id} for Universe {self.universe_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'universe_id': self.universe_id,
            'waveform': self.waveform,
            'attack': self.attack,
            'decay': self.decay,
            'sustain': self.sustain,
            'release': self.release,
            'lfo_rate': self.lfo_rate,
            'lfo_depth': self.lfo_depth,
            'filter_cutoff': self.filter_cutoff,
            'filter_resonance': self.filter_resonance,
            'reverb_amount': self.reverb_amount,
            'delay_time': self.delay_time,
            'delay_feedback': self.delay_feedback
        }
