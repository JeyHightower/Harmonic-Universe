"""Visualization renderer service."""
import numpy as np
from typing import Dict, Any, List
from ..models import VisualizationParameters


class Color:
    def __init__(self, r: float, g: float, b: float, a: float = 1.0):
        self.r = max(0.0, min(1.0, r))
        self.g = max(0.0, min(1.0, g))
        self.b = max(0.0, min(1.0, b))
        self.a = max(0.0, min(1.0, a))

    def to_dict(self) -> Dict[str, float]:
        return {"r": self.r, "g": self.g, "b": self.b, "a": self.a}

    @classmethod
    def from_hsv(cls, h: float, s: float, v: float, a: float = 1.0) -> "Color":
        """Create color from HSV values."""
        h = h % 1.0
        h_i = int(h * 6)
        f = h * 6 - h_i
        p = v * (1 - s)
        q = v * (1 - f * s)
        t = v * (1 - (1 - f) * s)

        if h_i == 0:
            r, g, b = v, t, p
        elif h_i == 1:
            r, g, b = q, v, p
        elif h_i == 2:
            r, g, b = p, v, t
        elif h_i == 3:
            r, g, b = p, q, v
        elif h_i == 4:
            r, g, b = t, p, v
        else:
            r, g, b = v, p, q

        return cls(r, g, b, a)


class Particle:
    def __init__(
        self,
        x: float,
        y: float,
        size: float,
        color: Color,
        velocity_x: float = 0.0,
        velocity_y: float = 0.0,
    ):
        self.x = x
        self.y = y
        self.size = size
        self.color = color
        self.velocity_x = velocity_x
        self.velocity_y = velocity_y

    def to_dict(self) -> Dict[str, Any]:
        return {
            "x": self.x,
            "y": self.y,
            "size": self.size,
            "color": self.color.to_dict(),
            "velocity": {"x": self.velocity_x, "y": self.velocity_y},
        }


class VisualizationRenderer:
    def __init__(self):
        """Initialize visualization renderer."""
        self.rng = np.random.default_rng()

    def _generate_color_palette(self, params: VisualizationParameters) -> List[Color]:
        """Generate color palette based on parameters."""
        palette = []
        base_hue = self.rng.random()  # Random base hue

        if params.color_scheme == "monochrome":
            # Generate shades of a single color
            for i in range(5):
                s = params.saturation * (0.5 + i * 0.1)
                v = params.brightness * (0.5 + i * 0.1)
                palette.append(Color.from_hsv(base_hue, s, v))

        elif params.color_scheme == "complementary":
            # Generate complementary color pairs
            for i in range(3):
                s = params.saturation * (0.7 + i * 0.1)
                v = params.brightness * (0.7 + i * 0.1)
                palette.append(Color.from_hsv(base_hue, s, v))
                palette.append(Color.from_hsv((base_hue + 0.5) % 1.0, s, v))

        elif params.color_scheme == "analogous":
            # Generate analogous colors
            for i in range(5):
                hue = (base_hue + i * 0.1) % 1.0
                palette.append(
                    Color.from_hsv(hue, params.saturation, params.brightness)
                )

        elif params.color_scheme == "triadic":
            # Generate triadic colors
            for i in range(2):
                for j in range(3):
                    hue = (base_hue + j * 0.333) % 1.0
                    s = params.saturation * (0.7 + i * 0.2)
                    v = params.brightness * (0.7 + i * 0.2)
                    palette.append(Color.from_hsv(hue, s, v))

        else:  # rainbow or custom
            # Generate full spectrum
            for i in range(6):
                hue = (base_hue + i * 0.167) % 1.0
                palette.append(
                    Color.from_hsv(hue, params.saturation, params.brightness)
                )

        return palette

    def _generate_particles(
        self,
        params: VisualizationParameters,
        width: int,
        height: int,
        palette: List[Color],
    ) -> List[Particle]:
        """Generate particles based on parameters."""
        particles = []
        particle_count = int(
            1000 * params.complexity
        )  # Scale particle count with complexity

        for _ in range(particle_count):
            x = self.rng.uniform(0, width)
            y = self.rng.uniform(0, height)
            size = self.rng.uniform(2, 10) * params.complexity
            color = self.rng.choice(palette)

            # Add some velocity for animation
            velocity_x = self.rng.normal(0, 2) * params.complexity
            velocity_y = self.rng.normal(0, 2) * params.complexity

            particles.append(Particle(x, y, size, color, velocity_x, velocity_y))

        return particles

    def _generate_effects(self, params: VisualizationParameters) -> Dict[str, Any]:
        """Generate visual effects based on parameters."""
        return {
            "blur": params.complexity * 10,
            "glow": {
                "enabled": params.brightness > 0.5,
                "intensity": params.brightness * 2,
                "radius": params.complexity * 20,
            },
            "trails": {
                "enabled": params.complexity > 0.3,
                "length": params.complexity * 20,
                "decay": 1 - params.complexity,
            },
            "noise": {
                "enabled": params.complexity > 0.7,
                "intensity": (params.complexity - 0.7) * 3,
                "scale": params.complexity * 100,
            },
        }

    def render(
        self,
        params: VisualizationParameters,
        width: int = 800,
        height: int = 600,
        quality: str = "high",
    ) -> Dict[str, Any]:
        """Render visualization based on parameters."""
        # Generate color palette
        palette = self._generate_color_palette(params)

        # Generate particles
        particles = self._generate_particles(params, width, height, palette)

        # Generate effects
        effects = self._generate_effects(params)

        # Quality settings
        quality_settings = {
            "low": {
                "particle_detail": 0.5,
                "effect_quality": 0.5,
                "antialiasing": False,
            },
            "medium": {
                "particle_detail": 0.75,
                "effect_quality": 0.75,
                "antialiasing": True,
            },
            "high": {
                "particle_detail": 1.0,
                "effect_quality": 1.0,
                "antialiasing": True,
            },
        }.get(quality.lower(), quality_settings["medium"])

        return {
            "width": width,
            "height": height,
            "quality": quality_settings,
            "parameters": {
                "brightness": params.brightness,
                "saturation": params.saturation,
                "complexity": params.complexity,
                "colorScheme": params.color_scheme,
            },
            "particles": [p.to_dict() for p in particles],
            "effects": effects,
            "palette": [c.to_dict() for c in palette],
        }
