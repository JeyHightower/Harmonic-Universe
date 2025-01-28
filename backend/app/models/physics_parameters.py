from . import db
from datetime import datetime

class PhysicsParameters(db.Model):
    """Physics parameters model for storing universe physics settings."""

    __tablename__ = 'physics_parameters'

    id = db.Column(db.Integer, primary_key=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)
    gravity = db.Column(db.Float, default=9.81)
    particle_speed = db.Column(db.Float, default=1.0)
    collision_damping = db.Column(db.Float, default=0.8)
    boundary_damping = db.Column(db.Float, default=0.9)
    particle_mass = db.Column(db.Float, default=1.0)
    particle_radius = db.Column(db.Float, default=0.5)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, universe, gravity=9.81, particle_speed=1.0, collision_damping=0.8,
                 boundary_damping=0.9, particle_mass=1.0, particle_radius=0.5):
        self.universe_id = universe.id
        self.gravity = gravity
        self.particle_speed = particle_speed
        self.collision_damping = collision_damping
        self.boundary_damping = boundary_damping
        self.particle_mass = particle_mass
        self.particle_radius = particle_radius

    def to_dict(self):
        """Convert physics parameters object to dictionary."""
        return {
            'id': self.id,
            'universe_id': self.universe_id,
            'gravity': self.gravity,
            'particle_speed': self.particle_speed,
            'collision_damping': self.collision_damping,
            'boundary_damping': self.boundary_damping,
            'particle_mass': self.particle_mass,
            'particle_radius': self.particle_radius,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def __repr__(self):
        return f'<PhysicsParameters for Universe {self.universe_id}>'

    def __json__(self):
        """Return a JSON serializable representation of the physics parameters"""
        return self.to_dict()

    def __json_encode__(self):
        """Make the object JSON serializable"""
        return self.to_dict()
