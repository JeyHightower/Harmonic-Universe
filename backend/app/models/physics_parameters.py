from datetime import datetime
from app.extensions import db

class PhysicsParameters(db.Model):
    __tablename__ = 'physics_parameters'

    id = db.Column(db.Integer, primary_key=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)
    gravity = db.Column(db.Float, nullable=False, default=9.81)
    elasticity = db.Column(db.Float, nullable=False, default=0.7)
    friction = db.Column(db.Float, nullable=False, default=0.3)
    air_resistance = db.Column(db.Float, nullable=False, default=0.1)
    density = db.Column(db.Float, nullable=False, default=1.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    universe = db.relationship('Universe', back_populates='physics_parameters', uselist=False)

    def __repr__(self):
        return f'<PhysicsParameters for Universe {self.universe_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'universe_id': self.universe_id,
            'gravity': self.gravity,
            'elasticity': self.elasticity,
            'friction': self.friction,
            'air_resistance': self.air_resistance,
            'density': self.density,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
