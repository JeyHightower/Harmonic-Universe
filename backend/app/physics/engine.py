"""Physics engine implementation."""
from dataclasses import dataclass, asdict
from typing import List, Tuple, Dict, Optional, Any
from enum import Enum
import math
import time
import uuid

class BoundaryType(str, Enum):
    """Types of boundary behavior."""
    NONE = 'none'
    WRAP = 'wrap'
    BOUNCE = 'bounce'
    ABSORB = 'absorb'

@dataclass
class Vector2D:
    """2D vector with basic operations."""
    x: float
    y: float

    def __add__(self, other: 'Vector2D') -> 'Vector2D':
        return Vector2D(self.x + other.x, self.y + other.y)

    def __sub__(self, other: 'Vector2D') -> 'Vector2D':
        return Vector2D(self.x - other.x, self.y - other.y)

    def __mul__(self, scalar: float) -> 'Vector2D':
        return Vector2D(self.x * scalar, self.y * scalar)

    def magnitude(self) -> float:
        return math.sqrt(self.x * self.x + self.y * self.y)

    def normalize(self) -> 'Vector2D':
        mag = self.magnitude()
        if mag == 0:
            return Vector2D(0, 0)
        return Vector2D(self.x / mag, self.y / mag)

    @classmethod
    def from_dict(cls, data: Dict[str, float]) -> 'Vector2D':
        """Create a Vector2D from a dictionary."""
        return cls(x=float(data['x']), y=float(data['y']))

    def to_dict(self) -> Dict[str, float]:
        """Convert to dictionary representation."""
        return {'x': self.x, 'y': self.y}

@dataclass
class Boundary:
    """Simulation boundary with type and dimensions."""
    type: BoundaryType = BoundaryType.NONE
    x_min: float = float('-inf')
    x_max: float = float('inf')
    y_min: float = float('-inf')
    y_max: float = float('inf')
    elasticity: float = 1.0

@dataclass
class Particle:
    """Particle in the physics simulation."""
    position: Vector2D
    velocity: Vector2D
    mass: float = 1.0
    radius: float = 0.5
    id: str = None

    def __post_init__(self):
        if self.id is None:
            self.id = str(uuid.uuid4())

    def apply_force(self, force: Vector2D):
        """Apply a force to the particle."""
        self.velocity = Vector2D(
            self.velocity.x + force.x / self.mass,
            self.velocity.y + force.y / self.mass
        )

    def update(self, dt: float):
        """Update particle position and velocity."""
        # First calculate new position using current velocity
        # x = x0 + v0t + 1/2at^2
        self.position = Vector2D(
            self.position.x + self.velocity.x * dt + 0.5 * dt * dt,
            self.position.y + self.velocity.y * dt + 0.5 * dt * dt
        )

        # Then update velocity
        # v = v0 + at
        self.velocity = Vector2D(
            self.velocity.x,
            self.velocity.y
        )

    def constrain_to_boundary(self, boundary: Boundary):
        """Apply boundary constraints to the particle."""
        if boundary.type == BoundaryType.NONE:
            return

        if boundary.type == BoundaryType.WRAP:
            # Wrap around boundaries
            self.position.x = (self.position.x - boundary.x_min) % (boundary.x_max - boundary.x_min) + boundary.x_min
            self.position.y = (self.position.y - boundary.y_min) % (boundary.y_max - boundary.y_min) + boundary.y_min

        elif boundary.type == BoundaryType.BOUNCE:
            # Bounce off boundaries with elasticity
            if self.position.x <= boundary.x_min:
                self.position.x = boundary.x_min
                self.velocity.x = abs(self.velocity.x) * boundary.elasticity
            elif self.position.x >= boundary.x_max:
                self.position.x = boundary.x_max
                self.velocity.x = -abs(self.velocity.x) * boundary.elasticity

            if self.position.y <= boundary.y_min:
                self.position.y = boundary.y_min
                self.velocity.y = abs(self.velocity.y) * boundary.elasticity
            elif self.position.y >= boundary.y_max:
                self.position.y = boundary.y_max
                self.velocity.y = -abs(self.velocity.y) * boundary.elasticity

        elif boundary.type == BoundaryType.ABSORB:
            # Stop at boundaries
            self.position.x = max(boundary.x_min, min(self.position.x, boundary.x_max))
            self.position.y = max(boundary.y_min, min(self.position.y, boundary.y_max))

            # Zero velocity at boundaries
            if self.position.x in (boundary.x_min, boundary.x_max):
                self.velocity.x = 0
            if self.position.y in (boundary.y_min, boundary.y_max):
                self.velocity.y = 0

    def to_dict(self) -> Dict:
        """Convert particle to dictionary representation."""
        return {
            'id': self.id,
            'position': {'x': self.position.x, 'y': self.position.y},
            'velocity': {'x': self.velocity.x, 'y': self.velocity.y},
            'mass': self.mass,
            'radius': self.radius
        }

class PhysicsEngine:
    """Physics engine for particle simulation."""

    def __init__(self, params):
        """Initialize physics engine with parameters."""
        self.gravity = params.gravity
        self.air_resistance = params.air_resistance
        self.elasticity = params.elasticity
        self.friction = params.friction
        self.particles: List[Particle] = []
        self.boundary = Boundary()

        # Performance metrics
        self.frame_times: List[float] = []
        self.collision_counts: List[int] = []
        self._last_update = time.time()

    def add_particle(self, position: Dict, velocity: Dict, mass: float = 1.0, radius: float = 0.5) -> Particle:
        """Add a particle to the simulation."""
        particle = Particle(
            position=Vector2D(float(position['x']), float(position['y'])),
            velocity=Vector2D(float(velocity['x']), float(velocity['y'])),
            mass=mass,
            radius=radius
        )
        self.particles.append(particle)
        return particle

    def clear_particles(self):
        """Remove all particles from the simulation."""
        self.particles.clear()

    def set_boundary(self, boundary_type: str, x_min: float = -10.0, x_max: float = 10.0,
                    y_min: float = -10.0, y_max: float = 10.0, elasticity: float = None):
        """Set simulation boundary."""
        self.boundary = Boundary(
            type=BoundaryType(boundary_type),
            x_min=x_min,
            x_max=x_max,
            y_min=y_min,
            y_max=y_max,
            elasticity=elasticity if elasticity is not None else self.elasticity
        )

    def apply_gravity(self, dt: float):
        """Apply gravity to all particles."""
        for particle in self.particles:
            particle.velocity.y -= self.gravity * dt

    def apply_air_resistance(self, dt: float):
        """Apply air resistance to all particles."""
        for particle in self.particles:
            velocity = particle.velocity.magnitude()
            if velocity > 0:
                drag = self.air_resistance * velocity * velocity
                direction = particle.velocity.normalize()
                particle.velocity.x -= direction.x * drag * dt / particle.mass
                particle.velocity.y -= direction.y * drag * dt / particle.mass

    def detect_collisions(self) -> List[Tuple[Particle, Particle]]:
        """Detect collisions between particles."""
        collisions = []
        for i, p1 in enumerate(self.particles[:-1]):
            for p2 in self.particles[i + 1:]:
                distance = math.sqrt(
                    (p2.position.x - p1.position.x) ** 2 +
                    (p2.position.y - p1.position.y) ** 2
                )
                if distance < (p1.radius + p2.radius):
                    collisions.append((p1, p2))
        return collisions

    def resolve_collisions(self, collisions: List[Tuple[Particle, Particle]]):
        """Resolve collisions between particles."""
        for p1, p2 in collisions:
            # Calculate normal vector
            normal = Vector2D(
                p2.position.x - p1.position.x,
                p2.position.y - p1.position.y
            ).normalize()

            # Calculate relative velocity
            relative_velocity = Vector2D(
                p2.velocity.x - p1.velocity.x,
                p2.velocity.y - p1.velocity.y
            )

            # Calculate impulse
            velocity_along_normal = (
                relative_velocity.x * normal.x +
                relative_velocity.y * normal.y
            )

            # Do not resolve if particles are moving apart
            if velocity_along_normal > 0:
                continue

            # Calculate restitution
            restitution = self.elasticity

            # Calculate impulse scalar
            j = -(1 + restitution) * velocity_along_normal
            j /= 1/p1.mass + 1/p2.mass

            # Apply impulse
            p1.velocity.x -= j * normal.x / p1.mass
            p1.velocity.y -= j * normal.y / p1.mass
            p2.velocity.x += j * normal.x / p2.mass
            p2.velocity.y += j * normal.y / p2.mass

    def constrain_to_boundary(self, particle: Particle):
        """Apply boundary constraints to particle."""
        if self.boundary.type == BoundaryType.NONE:
            return

        if self.boundary.type == BoundaryType.WRAP:
            # Wrap around boundaries
            if particle.position.x < self.boundary.x_min:
                particle.position.x = self.boundary.x_max
            elif particle.position.x > self.boundary.x_max:
                particle.position.x = self.boundary.x_min

            if particle.position.y < self.boundary.y_min:
                particle.position.y = self.boundary.y_max
            elif particle.position.y > self.boundary.y_max:
                particle.position.y = self.boundary.y_min

        elif self.boundary.type == BoundaryType.BOUNCE:
            # Bounce off boundaries
            if particle.position.x - particle.radius < self.boundary.x_min:
                particle.position.x = self.boundary.x_min + particle.radius
                particle.velocity.x = abs(particle.velocity.x) * self.boundary.elasticity
            elif particle.position.x + particle.radius > self.boundary.x_max:
                particle.position.x = self.boundary.x_max - particle.radius
                particle.velocity.x = -abs(particle.velocity.x) * self.boundary.elasticity

            if particle.position.y - particle.radius < self.boundary.y_min:
                particle.position.y = self.boundary.y_min + particle.radius
                particle.velocity.y = abs(particle.velocity.y) * self.boundary.elasticity
            elif particle.position.y + particle.radius > self.boundary.y_max:
                particle.position.y = self.boundary.y_max - particle.radius
                particle.velocity.y = -abs(particle.velocity.y) * self.boundary.elasticity

        elif self.boundary.type == BoundaryType.ABSORB:
            # Remove particles that hit boundaries
            if (particle.position.x - particle.radius < self.boundary.x_min or
                particle.position.x + particle.radius > self.boundary.x_max or
                particle.position.y - particle.radius < self.boundary.y_min or
                particle.position.y + particle.radius > self.boundary.y_max):
                self.particles.remove(particle)

    def update(self, dt: float):
        """Update physics simulation by one time step."""
        start_time = time.time()

        # Apply forces
        self.apply_gravity(dt)
        self.apply_air_resistance(dt)

        # Update positions
        for particle in self.particles[:]:  # Copy list to allow removal
            particle.position.x += particle.velocity.x * dt
            particle.position.y += particle.velocity.y * dt
            self.constrain_to_boundary(particle)

        # Handle collisions
        collisions = self.detect_collisions()
        self.resolve_collisions(collisions)

        # Update performance metrics
        frame_time = time.time() - start_time
        self.frame_times.append(frame_time)
        self.collision_counts.append(len(collisions))
        if len(self.frame_times) > 60:  # Keep last second of metrics
            self.frame_times.pop(0)
            self.collision_counts.pop(0)

    def get_performance_metrics(self) -> Dict:
        """Get performance metrics for the simulation."""
        return {
            'frame_time': sum(self.frame_times) / len(self.frame_times) if self.frame_times else 0,
            'collision_count': sum(self.collision_counts) / len(self.collision_counts) if self.collision_counts else 0,
            'particle_count': len(self.particles)
        }

    def get_state(self) -> Dict[str, Any]:
        """Get current simulation state."""
        return {
            'particles': [
                {
                    'id': p.id,
                    'position': {'x': p.position.x, 'y': p.position.y},
                    'velocity': {'x': p.velocity.x, 'y': p.velocity.y},
                    'mass': p.mass,
                    'radius': p.radius
                }
                for p in self.particles
            ],
            'time': time.time(),
            'frame': len(self.frame_times)
        }
