from typing import Dict, List, Tuple, Optional
import numpy as np
from dataclasses import dataclass
import colorsys

@dataclass
class VisualizationParameters:
    background_color: Tuple[float, float, float] = (0.1, 0.1, 0.2)
    particle_base_color: Tuple[float, float, float] = (0.8, 0.4, 0.2)
    particle_size_range: Tuple[float, float] = (5.0, 20.0)
    glow_intensity: float = 0.5
    trail_length: int = 20
    camera_zoom: float = 1.0
    camera_position: Tuple[float, float] = (0.0, 0.0)
    blur_amount: float = 0.2

@dataclass
class ParticleTrail:
    positions: List[Tuple[float, float]]
    colors: List[Tuple[float, float, float, float]]
    max_length: int

    def add_position(self, pos: Tuple[float, float], color: Tuple[float, float, float, float]):
        """Add new position to trail."""
        self.positions.append(pos)
        self.colors.append(color)
        if len(self.positions) > self.max_length:
            self.positions.pop(0)
            self.colors.pop(0)

class VisualizationRenderer:
    def __init__(self):
        self.params = VisualizationParameters()
        self.particle_trails: Dict[int, ParticleTrail] = {}
        self.frame_count = 0

    def update_parameters(self, params: Dict):
        """Update visualization parameters."""
        if 'background_color' in params:
            self.params.background_color = tuple(params['background_color'])
        if 'particle_base_color' in params:
            self.params.particle_base_color = tuple(params['particle_base_color'])
        if 'particle_size_range' in params:
            self.params.particle_size_range = tuple(params['particle_size_range'])
        if 'glow_intensity' in params:
            self.params.glow_intensity = float(params['glow_intensity'])
        if 'trail_length' in params:
            self.params.trail_length = int(params['trail_length'])
        if 'camera_zoom' in params:
            self.params.camera_zoom = float(params['camera_zoom'])
        if 'camera_position' in params:
            self.params.camera_position = tuple(params['camera_position'])
        if 'blur_amount' in params:
            self.params.blur_amount = float(params['blur_amount'])

    def calculate_particle_color(self, velocity: np.ndarray, mass: float, harmony_value: float) -> Tuple[float, float, float, float]:
        """Calculate particle color based on its properties."""
        # Use velocity magnitude to affect hue
        velocity_magnitude = np.linalg.norm(velocity)
        hue = (velocity_magnitude * 0.1) % 1.0

        # Use mass to affect saturation
        saturation = min(1.0, mass * 0.2 + 0.3)

        # Use harmony value to affect brightness
        value = min(1.0, harmony_value * 0.5 + 0.5)

        # Convert HSV to RGB
        rgb = colorsys.hsv_to_rgb(hue, saturation, value)

        # Add alpha channel
        return rgb + (min(1.0, velocity_magnitude * 0.2 + 0.6),)

    def calculate_particle_size(self, mass: float) -> float:
        """Calculate particle size based on its mass."""
        min_size, max_size = self.params.particle_size_range
        return min_size + (max_size - min_size) * min(1.0, mass * 0.5)

    def update_particle_trails(self, particles: List[Dict], harmony_value: float):
        """Update particle trails with new positions."""
        self.frame_count += 1

        # Update existing trails and create new ones
        current_particles = set()
        for particle in particles:
            particle_id = id(particle)
            current_particles.add(particle_id)

            position = tuple(particle['position'])
            velocity = particle['velocity']
            mass = particle['mass']

            color = self.calculate_particle_color(velocity, mass, harmony_value)

            if particle_id not in self.particle_trails:
                self.particle_trails[particle_id] = ParticleTrail(
                    positions=[position],
                    colors=[color],
                    max_length=self.params.trail_length
                )
            else:
                self.particle_trails[particle_id].add_position(position, color)

        # Remove trails for particles that no longer exist
        for particle_id in list(self.particle_trails.keys()):
            if particle_id not in current_particles:
                del self.particle_trails[particle_id]

    def apply_camera_transform(self, position: Tuple[float, float]) -> Tuple[float, float]:
        """Apply camera transformation to position."""
        x, y = position
        cam_x, cam_y = self.params.camera_position
        return (
            (x - cam_x) * self.params.camera_zoom,
            (y - cam_y) * self.params.camera_zoom
        )

    def get_render_data(self) -> Dict:
        """Get current render data for visualization."""
        return {
            'frame': self.frame_count,
            'background_color': self.params.background_color,
            'camera': {
                'position': self.params.camera_position,
                'zoom': self.params.camera_zoom
            },
            'particles': [
                {
                    'trail_positions': [
                        self.apply_camera_transform(pos)
                        for pos in trail.positions
                    ],
                    'trail_colors': trail.colors,
                    'size': self.calculate_particle_size(
                        float(trail.colors[-1][1])  # Use saturation as proxy for mass
                    )
                }
                for trail in self.particle_trails.values()
            ],
            'effects': {
                'glow_intensity': self.params.glow_intensity,
                'blur_amount': self.params.blur_amount
            }
        }
