from datetime import datetime
from ..database import db
from .base import BaseModel

class Physics2D(BaseModel):
    __tablename__ = 'physics_2d'
    
    id = db.Column(db.Integer, primary_key=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)
    gravity = db.Column(db.Float, default=9.81)
    air_resistance = db.Column(db.Float, default=0.0)
    friction = db.Column(db.Float, default=0.0)
    
    # Relationships
    universe = db.relationship('Universe', backref=db.backref('physics_2d', uselist=False))
    objects = db.relationship('PhysicsObject', backref='physics_2d', lazy=True)
    
    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            'id': self.id,
            'universe_id': self.universe_id,
            'gravity': self.gravity,
            'air_resistance': self.air_resistance,
            'friction': self.friction,
            'objects': [obj.to_dict() for obj in self.objects]
        })
        return base_dict 