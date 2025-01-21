"""Physics parameters model for the simulation."""
from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.extensions import db

class PhysicsParameters(db.Model):
    """Model for physics simulation parameters."""
    __tablename__ = 'physics_parameters'

    id = Column(Integer, primary_key=True)
    universe_id = Column(Integer, ForeignKey('universes.id'), nullable=False)

    # Basic physics parameters
    gravity = Column(Float, default=9.81)
    elasticity = Column(Float, default=0.7)
    friction = Column(Float, default=0.3)
    air_resistance = Column(Float, default=0.1)
    density = Column(Float, default=1.0)

    # Time parameters
    time_scale = Column(Float, default=1.0)
    max_time_step = Column(Float, default=1/60)

    # Particle parameters
    particle_min_radius = Column(Float, default=0.5)
    particle_max_radius = Column(Float, default=2.0)
    particle_min_mass = Column(Float, default=0.1)
    particle_max_mass = Column(Float, default=5.0)
    max_particles = Column(Integer, default=100)

    # Force field parameters
    field_strength = Column(Float, default=1.0)
    field_radius = Column(Float, default=10.0)
    field_falloff = Column(Float, default=2.0)

    # Collision parameters
    collision_damping = Column(Float, default=0.1)
    collision_threshold = Column(Float, default=0.01)
    restitution_coefficient = Column(Float, default=0.8)

    # Relationships
    universe = relationship("Universe", back_populates="physics_parameters")

    def to_dict(self):
        """Convert the parameters to a dictionary."""
        return {
            'id': self.id,
            'universe_id': self.universe_id,
            'gravity': self.gravity,
            'elasticity': self.elasticity,
            'friction': self.friction,
            'air_resistance': self.air_resistance,
            'density': self.density,
            'time_scale': self.time_scale,
            'max_time_step': self.max_time_step,
            'particle_min_radius': self.particle_min_radius,
            'particle_max_radius': self.particle_max_radius,
            'particle_min_mass': self.particle_min_mass,
            'particle_max_mass': self.particle_max_mass,
            'max_particles': self.max_particles,
            'field_strength': self.field_strength,
            'field_radius': self.field_radius,
            'field_falloff': self.field_falloff,
            'collision_damping': self.collision_damping,
            'collision_threshold': self.collision_threshold,
            'restitution_coefficient': self.restitution_coefficient
        }

    @staticmethod
    def from_dict(data):
        """Create a PhysicsParameters instance from a dictionary."""
        return PhysicsParameters(
            universe_id=data.get('universe_id'),
            gravity=data.get('gravity', 9.81),
            elasticity=data.get('elasticity', 0.7),
            friction=data.get('friction', 0.3),
            air_resistance=data.get('air_resistance', 0.1),
            density=data.get('density', 1.0),
            time_scale=data.get('time_scale', 1.0),
            max_time_step=data.get('max_time_step', 1/60),
            particle_min_radius=data.get('particle_min_radius', 0.5),
            particle_max_radius=data.get('particle_max_radius', 2.0),
            particle_min_mass=data.get('particle_min_mass', 0.1),
            particle_max_mass=data.get('particle_max_mass', 5.0),
            max_particles=data.get('max_particles', 100),
            field_strength=data.get('field_strength', 1.0),
            field_radius=data.get('field_radius', 10.0),
            field_falloff=data.get('field_falloff', 2.0),
            collision_damping=data.get('collision_damping', 0.1),
            collision_threshold=data.get('collision_threshold', 0.01),
            restitution_coefficient=data.get('restitution_coefficient', 0.8)
        )
