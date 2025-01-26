from typing import Dict, Optional
from app.models import PhysicsParameters
from app.services.base import BaseService


class PhysicsService(BaseService):
    """Service class for PhysicsParameters model operations."""

    def __init__(self):
        super().__init__(PhysicsParameters)

    def create_parameters(
        self, universe_id: int, data: Dict
    ) -> Optional[PhysicsParameters]:
        """Create physics parameters for a universe."""
        if self.exists(universe_id=universe_id):
            raise ValueError("Physics parameters already exist for this universe")

        data["universe_id"] = universe_id
        return self.create(data)

    def get_universe_parameters(self, universe_id: int) -> Optional[PhysicsParameters]:
        """Get physics parameters for a universe."""
        return self.get_one_by_filter(universe_id=universe_id)

    def update_parameters(
        self, universe_id: int, data: Dict
    ) -> Optional[PhysicsParameters]:
        """Update physics parameters for a universe."""
        params = self.get_one_by_filter(universe_id=universe_id)
        if not params:
            return None

        return self.update(params.id, data)

    def delete_parameters(self, universe_id: int) -> bool:
        """Delete physics parameters for a universe."""
        params = self.get_one_by_filter(universe_id=universe_id)
        if not params:
            return False

        return self.delete(params.id)

    def validate_parameters(self, data: Dict) -> bool:
        """Validate physics parameters."""
        try:
            # Gravity must be positive
            if "gravity" in data and data["gravity"] <= 0:
                return False

            # Friction must be between 0 and 1
            if "friction" in data and not 0 <= data["friction"] <= 1:
                return False

            # Time scale must be positive
            if "time_scale" in data and data["time_scale"] <= 0:
                return False

            # Particle speed must be non-negative
            if "particle_speed" in data and data["particle_speed"] < 0:
                return False

            return True
        except (TypeError, ValueError):
            return False

    def reset_to_defaults(self, universe_id: int) -> Optional[PhysicsParameters]:
        """Reset physics parameters to default values."""
        default_params = {
            "gravity": 9.81,
            "friction": 0.5,
            "time_scale": 1.0,
            "air_resistance": 0.1,
            "density": 1.0,
            "particle_speed": 1.0,
        }

        return self.update_parameters(universe_id, default_params)
