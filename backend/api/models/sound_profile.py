from datetime import datetime
from ..database import db
from .base import BaseModel

class SoundProfile(BaseModel):
    __tablename__ = 'sound_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    volume = db.Column(db.Float, default=1.0)
    pitch = db.Column(db.Float, default=1.0)
    pan = db.Column(db.Float, default=0.0)  # -1 (left) to 1 (right)
    reverb = db.Column(db.Float, default=0.0)
    delay = db.Column(db.Float, default=0.0)
    echo = db.Column(db.Float, default=0.0)
    chorus = db.Column(db.Float, default=0.0)
    distortion = db.Column(db.Float, default=0.0)
    low_pass = db.Column(db.Float, default=20000.0)  # Hz
    high_pass = db.Column(db.Float, default=20.0)  # Hz
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id'))
    
    # Relationships
    universe = db.relationship('Universe', backref=db.backref('sound_profiles', lazy=True))
    scene = db.relationship('Scene', backref=db.backref('sound_profiles', lazy=True))
    
    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'volume': self.volume,
            'pitch': self.pitch,
            'pan': self.pan,
            'reverb': self.reverb,
            'delay': self.delay,
            'echo': self.echo,
            'chorus': self.chorus,
            'distortion': self.distortion,
            'low_pass': self.low_pass,
            'high_pass': self.high_pass,
            'universe_id': self.universe_id,
            'scene_id': self.scene_id
        })
        return base_dict 