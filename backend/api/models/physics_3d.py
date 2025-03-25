from datetime import datetime
from ..database import db
from .base import BaseModel

class Physics3D(BaseModel):
    __tablename__ = 'physics_3d'
    
    id = db.Column(db.Integer, primary_key=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)
    gravity_x = db.Column(db.Float, default=0.0)
    gravity_y = db.Column(db.Float, default=0.0)
    gravity_z = db.Column(db.Float, default=-9.81)
    air_resistance = db.Column(db.Float, default=0.0)
    friction = db.Column(db.Float, default=0.0)
    
    # Relationships
    universe = db.relationship('Universe', backref=db.backref('physics_3d', uselist=False))
    objects = db.relationship('PhysicsObject', backref='physics_3d', lazy=True)
    
    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            'id': self.id,
            'universe_id': self.universe_id,
            'gravity_x': self.gravity_x,
            'gravity_y': self.gravity_y,
            'gravity_z': self.gravity_z,
            'air_resistance': self.air_resistance,
            'friction': self.friction,
            'objects': [obj.to_dict() for obj in self.objects]
        })
        return base_dict 