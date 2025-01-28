from dataclasses import dataclass
import numpy as np
from typing import Dict, List, Optional
from ..models.universe import Universe

@dataclass
class PhysicsObject:
    id: int
    position: np.ndarray
    velocity: np.ndarray
    mass: float
    radius: float
    charge: float = 0.0

class PhysicsEngine:
    """Core physics engine for universe simulation."""

    def __init__(self, universe_id: int, parameters: Dict):
        self.universe_id = universe_id
        self.parameters = parameters
        self.objects: List[PhysicsObject] = []
        self.G = parameters.get('gravity', 6.67430e-11)  # Gravitational constant
        self.k = parameters.get('coulomb', 8.9875e9)     # Coulomb constant
        self.damping = parameters.get('damping', 0.01)   # Damping coefficient

    def add_object(self, obj: PhysicsObject):
        """Add an object to the simulation."""
        self.objects.append(obj)

    def remove_object(self, obj_id: int):
        """Remove an object from the simulation."""
        self.objects = [obj for obj in self.objects if obj.id != obj_id]

    def calculate_gravity(self, obj1: PhysicsObject, obj2: PhysicsObject) -> np.ndarray:
        """Calculate gravitational force between two objects."""
        r = obj2.position - obj1.position
        distance = np.linalg.norm(r)
        if distance < 1e-10:  # Avoid division by zero
            return np.zeros(3)
        force_magnitude = self.G * obj1.mass * obj2.mass / (distance ** 2)
        return force_magnitude * r / distance

    def calculate_electromagnetic(self, obj1: PhysicsObject, obj2: PhysicsObject) -> np.ndarray:
        """Calculate electromagnetic force between two objects."""
        r = obj2.position - obj1.position
        distance = np.linalg.norm(r)
        if distance < 1e-10:
            return np.zeros(3)
        force_magnitude = self.k * abs(obj1.charge * obj2.charge) / (distance ** 2)
        # Attractive if opposite charges, repulsive if same charge
        sign = -1 if obj1.charge * obj2.charge < 0 else 1
        return sign * force_magnitude * r / distance

    def apply_forces(self, dt: float):
        """Apply all forces and update object positions."""
        for i, obj1 in enumerate(self.objects):
            total_force = np.zeros(3)

            # Calculate forces from all other objects
            for j, obj2 in enumerate(self.objects):
                if i != j:
                    total_force += self.calculate_gravity(obj1, obj2)
                    total_force += self.calculate_electromagnetic(obj1, obj2)

            # Apply damping force
            total_force -= self.damping * obj1.velocity

            # Update velocity and position using Verlet integration
            acceleration = total_force / obj1.mass
            obj1.velocity += acceleration * dt
            obj1.position += obj1.velocity * dt

    def check_collisions(self):
        """Check for and handle collisions between objects."""
        for i, obj1 in enumerate(self.objects):
            for j, obj2 in enumerate(self.objects[i+1:], i+1):
                r = obj2.position - obj1.position
                distance = np.linalg.norm(r)

                if distance < (obj1.radius + obj2.radius):
                    # Elastic collision
                    normal = r / distance
                    relative_velocity = obj1.velocity - obj2.velocity

                    # Calculate impulse
                    j = -(1 + 0.8) * np.dot(relative_velocity, normal)  # 0.8 is restitution
                    j /= 1/obj1.mass + 1/obj2.mass

                    # Apply impulse
                    obj1.velocity += (j / obj1.mass) * normal
                    obj2.velocity -= (j / obj2.mass) * normal

                    # Separate objects to prevent sticking
                    overlap = obj1.radius + obj2.radius - distance
                    obj1.position -= 0.5 * overlap * normal
                    obj2.position += 0.5 * overlap * normal

    def step(self, dt: float):
        """Advance simulation by one timestep."""
        self.apply_forces(dt)
        self.check_collisions()
        return [(obj.id, obj.position.tolist(), obj.velocity.tolist()) for obj in self.objects]

    def get_state(self) -> Dict:
        """Get current state of all objects."""
        return {
            'objects': [
                {
                    'id': obj.id,
                    'position': obj.position.tolist(),
                    'velocity': obj.velocity.tolist(),
                    'mass': obj.mass,
                    'radius': obj.radius,
                    'charge': obj.charge
                }
                for obj in self.objects
            ],
            'parameters': {
                'G': self.G,
                'k': self.k,
                'damping': self.damping
            }
        }

    def set_parameters(self, parameters: Dict):
        """Update physics parameters."""
        self.G = parameters.get('gravity', self.G)
        self.k = parameters.get('coulomb', self.k)
        self.damping = parameters.get('damping', self.damping)
