"""Physics engine implementation."""
import numpy as np
from dataclasses import dataclass
from typing import List, Tuple, Optional

@dataclass
class Vector2D:
    """2D vector class for physics calculations."""
    x: float
    y: float

    def __add__(self, other: 'Vector2D') -> 'Vector2D':
        return Vector2D(self.x + other.x, self.y + other.y)

    def __sub__(self, other: 'Vector2D') -> 'Vector2D':
        return Vector2D(self.x - other.x, self.y - other.y)

    def __mul__(self, scalar: float) -> 'Vector2D':
        return Vector2D(self.x * scalar, self.y * scalar)

    def magnitude(self) -> float:
        return np.sqrt(self.x * self.x + self.y * self.y)

    def normalize(self) -> 'Vector2D':
        mag = self.magnitude()
        if mag == 0:
            return Vector2D(0, 0)
        return Vector2D(self.x / mag, self.y / mag)

@dataclass
class Particle:
    """Particle class for physics simulation."""
    position: Vector2D
    velocity: Vector2D
    acceleration: Vector2D
    mass: float
    radius: float
    elasticity: float
    id: int

    def apply_force(self, force: Vector2D):
        """Apply a force to the particle."""
        self.acceleration = Vector2D(
            force.x / self.mass,
            force.y / self.mass
        )

    def update(self, dt: float):
        """Update particle position and velocity."""
        # First calculate new position using current velocity
        # x = x0 + v0t + 1/2at^2
        self.position = Vector2D(
            self.position.x + self.velocity.x * dt + 0.5 * self.acceleration.x * dt * dt,
            self.position.y + self.velocity.y * dt + 0.5 * self.acceleration.y * dt * dt
        )

        # Then update velocity
        # v = v0 + at
        self.velocity = Vector2D(
            self.velocity.x + self.acceleration.x * dt,
            self.velocity.y + self.acceleration.y * dt
        )

class PhysicsEngine:
    """Physics engine for particle simulation."""
    def __init__(self, parameters):
        """Initialize the physics engine with parameters."""
        self.gravity = parameters.gravity
        self.elasticity = parameters.elasticity
        self.air_resistance = parameters.air_resistance
        self.particles: List[Particle] = []

    def add_particle(self, particle: Particle):
        """Add a particle to the simulation."""
        self.particles.append(particle)

    def apply_gravity(self):
        """Apply gravity to all particles."""
        for particle in self.particles:
            particle.apply_force(Vector2D(0, -self.gravity * particle.mass))

    def apply_air_resistance(self):
        """Apply air resistance to all particles."""
        for particle in self.particles:
            velocity_mag = particle.velocity.magnitude()
            if velocity_mag > 0:
                force = particle.velocity.normalize() * (-self.air_resistance * velocity_mag * velocity_mag)
                particle.apply_force(force)

    def detect_collisions(self) -> List[Tuple[Particle, Particle]]:
        """Detect collisions between particles."""
        collisions = []
        for i, p1 in enumerate(self.particles):
            for p2 in self.particles[i+1:]:
                distance = (p2.position - p1.position).magnitude()
                if distance < p1.radius + p2.radius:
                    collisions.append((p1, p2))
        return collisions

    def resolve_collisions(self, collisions: List[Tuple[Particle, Particle]]):
        """Resolve collisions between particles."""
        for p1, p2 in collisions:
            # Calculate collision normal
            normal = (p2.position - p1.position).normalize()

            # Calculate relative velocity
            relative_velocity = p2.velocity - p1.velocity

            # Calculate impulse
            restitution = min(p1.elasticity, p2.elasticity)
            impulse_numerator = -(1 + restitution) * (relative_velocity.x * normal.x + relative_velocity.y * normal.y)
            impulse_denominator = 1/p1.mass + 1/p2.mass
            impulse = impulse_numerator / impulse_denominator

            # Apply impulse
            p1.velocity = p1.velocity - normal * (impulse / p1.mass)
            p2.velocity = p2.velocity + normal * (impulse / p2.mass)

    def calculate_total_energy(self) -> float:
        """Calculate total energy in the system."""
        total_energy = 0.0
        for particle in self.particles:
            # Kinetic energy: 1/2 * m * v^2
            kinetic = 0.5 * particle.mass * (particle.velocity.magnitude() ** 2)
            # Potential energy: m * g * h
            potential = particle.mass * self.gravity * particle.position.y
            total_energy += kinetic + potential
        return total_energy

    def update(self, dt: float):
        """Update the physics simulation."""
        # Apply forces
        self.apply_gravity()
        self.apply_air_resistance()

        # Detect and resolve collisions
        collisions = self.detect_collisions()
        self.resolve_collisions(collisions)

        # Update particles
        for particle in self.particles:
            particle.update(dt)

    def clear(self):
        """Clear all particles from the simulation."""
        self.particles.clear()
