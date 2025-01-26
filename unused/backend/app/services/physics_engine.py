"""Physics simulation engine for Harmonic Universe."""
import numpy as np
from typing import List, Dict, Any
from dataclasses import dataclass
from ..models import PhysicsParameters


@dataclass
class Vector2D:
    """2D vector for physics calculations."""

    x: float
    y: float

    def __add__(self, other: "Vector2D") -> "Vector2D":
        return Vector2D(self.x + other.x, self.y + other.y)

    def __sub__(self, other: "Vector2D") -> "Vector2D":
        return Vector2D(self.x - other.x, self.y - other.y)

    def __mul__(self, scalar: float) -> "Vector2D":
        return Vector2D(self.x * scalar, self.y * scalar)

    def magnitude(self) -> float:
        return np.sqrt(self.x * self.x + self.y * self.y)

    def normalize(self) -> "Vector2D":
        mag = self.magnitude()
        if mag == 0:
            return Vector2D(0, 0)
        return Vector2D(self.x / mag, self.y / mag)


@dataclass
class Particle:
    """Particle for physics simulation."""

    position: Vector2D
    velocity: Vector2D
    acceleration: Vector2D
    mass: float
    radius: float
    elasticity: float
    id: int

    def apply_force(self, force: Vector2D):
        """Apply a force to the particle."""
        self.acceleration = force * (1.0 / self.mass)

    def update(self, dt: float):
        """Update particle position and velocity."""
        self.velocity = self.velocity + self.acceleration * dt
        self.position = self.position + self.velocity * dt


class PhysicsEngine:
    """Physics simulation engine."""

    def __init__(self, parameters: PhysicsParameters):
        self.parameters = parameters
        self.particles: List[Particle] = []
        self.time_scale = 1.0
        self.accumulated_time = 0.0
        self.frame_count = 0

    def add_particle(
        self,
        position: Vector2D,
        velocity: Vector2D,
        mass: float = 1.0,
        radius: float = 1.0,
    ) -> Particle:
        """Add a particle to the simulation."""
        particle = Particle(
            position=position,
            velocity=velocity,
            acceleration=Vector2D(0, 0),
            mass=mass,
            radius=radius,
            elasticity=self.parameters.elasticity,
            id=len(self.particles),
        )
        self.particles.append(particle)
        return particle

    def apply_gravity(self, particle: Particle):
        """Apply gravity force to a particle."""
        gravity_force = Vector2D(0, -self.parameters.gravity * particle.mass)
        particle.apply_force(gravity_force)

    def apply_air_resistance(self, particle: Particle):
        """Apply air resistance force to a particle."""
        if particle.velocity.magnitude() == 0:
            return

        air_force = particle.velocity.normalize() * (
            -0.5
            * self.parameters.air_resistance
            * self.parameters.density
            * particle.velocity.magnitude() ** 2
        )
        particle.apply_force(air_force)

    def check_collision(self, p1: Particle, p2: Particle) -> bool:
        """Check for collision between two particles."""
        distance = (p2.position - p1.position).magnitude()
        return distance <= (p1.radius + p2.radius)

    def resolve_collision(self, p1: Particle, p2: Particle):
        """Resolve collision between two particles."""
        normal = (p2.position - p1.position).normalize()
        relative_velocity = p2.velocity - p1.velocity

        # Calculate impulse
        elasticity = min(p1.elasticity, p2.elasticity)
        j = -(1 + elasticity) * relative_velocity.magnitude()
        j = j / (1 / p1.mass + 1 / p2.mass)

        # Apply impulse
        p1.velocity = p1.velocity - normal * (j / p1.mass)
        p2.velocity = p2.velocity + normal * (j / p2.mass)

    def update(self, dt: float) -> Dict[str, Any]:
        """Update physics simulation."""
        self.accumulated_time += dt * self.time_scale
        self.frame_count += 1

        # Update each particle
        for particle in self.particles:
            # Reset acceleration
            particle.acceleration = Vector2D(0, 0)

            # Apply forces
            self.apply_gravity(particle)
            self.apply_air_resistance(particle)

            # Update position and velocity
            particle.update(dt)

        # Check for collisions
        for i in range(len(self.particles)):
            for j in range(i + 1, len(self.particles)):
                if self.check_collision(self.particles[i], self.particles[j]):
                    self.resolve_collision(self.particles[i], self.particles[j])

        # Return simulation state
        return {
            "particles": [
                {
                    "id": p.id,
                    "position": {"x": p.position.x, "y": p.position.y},
                    "velocity": {"x": p.velocity.x, "y": p.velocity.y},
                    "radius": p.radius,
                    "mass": p.mass,
                }
                for p in self.particles
            ],
            "time": self.accumulated_time,
            "frame": self.frame_count,
        }

    def get_energy(self) -> Dict[str, float]:
        """Calculate total energy in the system."""
        kinetic_energy = sum(
            0.5 * p.mass * p.velocity.magnitude() ** 2 for p in self.particles
        )
        potential_energy = sum(
            p.mass * self.parameters.gravity * p.position.y for p in self.particles
        )
        return {
            "kinetic": kinetic_energy,
            "potential": potential_energy,
            "total": kinetic_energy + potential_energy,
        }

    def clear(self):
        """Clear all particles from the simulation."""
        self.particles.clear()
        self.accumulated_time = 0.0
        self.frame_count = 0
