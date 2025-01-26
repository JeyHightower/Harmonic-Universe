import numpy as np
from typing import Dict, Tuple, List


class PhysicsSimulator:
    def __init__(self):
        self.gravity = 9.81  # m/s^2
        self.time_step = 0.016  # ~60fps
        self.particles: List[Dict] = []
        self.elasticity = 0.7  # Add default elasticity
        self.friction = 0.3  # Add default friction
        self.air_resistance = 0.1  # Add default air resistance
        self.density = 1.0  # Add default density

    def update_parameters(self, params: Dict):
        """Update physics parameters."""
        self.gravity = params.get("gravity", self.gravity)
        self.elasticity = params.get("elasticity", 0.7)
        self.friction = params.get("friction", 0.3)
        self.air_resistance = params.get("air_resistance", 0.1)
        self.density = params.get("density", 1.0)

    def create_particle(self, x: float, y: float, mass: float = 1.0) -> Dict:
        """Create a new particle with initial position and properties."""
        particle = {
            "position": np.array([x, y], dtype=float),
            "velocity": np.array([0.0, 0.0], dtype=float),
            "acceleration": np.array([0.0, 0.0], dtype=float),
            "mass": mass,
            "forces": np.array([0.0, 0.0], dtype=float),
        }
        self.particles.append(particle)
        return particle

    def apply_gravity(self, particle: Dict):
        """Apply gravitational force to a particle."""
        particle["forces"][1] -= particle["mass"] * self.gravity

    def apply_air_resistance(self, particle: Dict):
        """Apply air resistance force to a particle."""
        if np.any(particle["velocity"]):
            velocity_squared = np.square(particle["velocity"])
            drag_force = -0.5 * self.density * self.air_resistance * velocity_squared
            particle["forces"] += drag_force * np.sign(particle["velocity"])

    def apply_friction(self, particle: Dict):
        """Apply friction force to a particle."""
        if np.any(particle["velocity"]):
            friction_force = (
                -self.friction * particle["mass"] * np.sign(particle["velocity"])
            )
            particle["forces"] += friction_force

    def handle_collision(
        self, particle: Dict, bounds: Tuple[float, float, float, float]
    ):
        """Handle collision with boundaries."""
        x_min, x_max, y_min, y_max = bounds
        position = particle["position"]
        velocity = particle["velocity"]

        # Check X boundaries
        if position[0] < x_min:
            position[0] = x_min
            velocity[0] = -velocity[0] * self.elasticity
        elif position[0] > x_max:
            position[0] = x_max
            velocity[0] = -velocity[0] * self.elasticity

        # Check Y boundaries
        if position[1] < y_min:
            position[1] = y_min
            velocity[1] = -velocity[1] * self.elasticity
        elif position[1] > y_max:
            position[1] = y_max
            velocity[1] = -velocity[1] * self.elasticity

    def update(self, bounds: Tuple[float, float, float, float]) -> List[Dict]:
        """Update physics simulation for one time step."""
        for particle in self.particles:
            # Reset forces
            particle["forces"] = np.array([0.0, 0.0], dtype=float)

            # Apply forces
            self.apply_gravity(particle)
            self.apply_air_resistance(particle)
            self.apply_friction(particle)

            # Update acceleration
            particle["acceleration"] = particle["forces"] / particle["mass"]

            # Update velocity
            particle["velocity"] += particle["acceleration"] * self.time_step

            # Update position
            particle["position"] += particle["velocity"] * self.time_step

            # Handle collisions
            self.handle_collision(particle, bounds)

        return self.particles

    def map_to_audio_params(self) -> Dict:
        """Map physics state to audio parameters."""
        if not self.particles:
            return {}

        # Calculate average kinetic energy and height
        total_energy = 0
        avg_height = 0
        max_velocity = 0

        for particle in self.particles:
            velocity = np.linalg.norm(particle["velocity"])
            max_velocity = max(max_velocity, velocity)
            kinetic_energy = 0.5 * particle["mass"] * velocity**2
            total_energy += kinetic_energy
            avg_height += particle["position"][1]

        avg_height /= len(self.particles)
        avg_energy = total_energy / len(self.particles)

        # Map physics properties to audio parameters
        return {
            "frequency": 220 + (avg_height * 10),  # Map height to frequency
            "amplitude": min(
                0.8, max(0.1, avg_energy / 100)
            ),  # Map energy to amplitude
            "filter_cutoff": min(
                0.9, max(0.1, max_velocity / 20)
            ),  # Map max velocity to filter
            "reverb_amount": min(
                0.9, max(0.1, self.elasticity)
            ),  # Map elasticity to reverb
        }
