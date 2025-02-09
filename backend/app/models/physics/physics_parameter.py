"""
Physics parameter model.
"""

from sqlalchemy import Column, Float, ForeignKey, Boolean, String, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.core.base import BaseModel
from typing import Dict, Optional

class PhysicsParameter(BaseModel):
    """Physics parameters for a scene with advanced configuration."""
    __tablename__ = "physics_parameters"

    scene_id = Column(UUID(as_uuid=True), ForeignKey("scenes.id", ondelete="CASCADE"), unique=True)
    version = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)

    # Basic physics parameters
    gravity = Column(JSONB, default=lambda: {
        'value': 9.81,
        'unit': 'm/s²',
        'min': 0,
        'max': 20,
        'enabled': True
    })

    air_resistance = Column(JSONB, default=lambda: {
        'value': 0.1,
        'unit': 'kg/m³',
        'min': 0,
        'max': 1,
        'enabled': True
    })

    collision_elasticity = Column(JSONB, default=lambda: {
        'value': 0.7,
        'unit': 'coefficient',
        'min': 0,
        'max': 1,
        'enabled': True
    })

    friction = Column(JSONB, default=lambda: {
        'value': 0.3,
        'unit': 'coefficient',
        'min': 0,
        'max': 1,
        'enabled': True
    })

    # Advanced physics parameters
    temperature = Column(JSONB, default=lambda: {
        'value': 293.15,
        'unit': 'K',
        'min': 0,
        'max': 1000,
        'enabled': True
    })

    pressure = Column(JSONB, default=lambda: {
        'value': 101.325,
        'unit': 'kPa',
        'min': 0,
        'max': 200,
        'enabled': True
    })

    # Fluid dynamics parameters
    fluid_density = Column(JSONB, default=lambda: {
        'value': 1.225,  # Air density at sea level
        'unit': 'kg/m³',
        'min': 0,
        'max': 2000,
        'enabled': False
    })

    viscosity = Column(JSONB, default=lambda: {
        'value': 1.81e-5,  # Air viscosity at 20°C
        'unit': 'Pa·s',
        'min': 0,
        'max': 1,
        'enabled': False
    })

    # Simulation parameters
    time_step = Column(JSONB, default=lambda: {
        'value': 0.016,  # 60 FPS
        'unit': 's',
        'min': 0.001,
        'max': 0.1,
        'enabled': True
    })

    substeps = Column(JSONB, default=lambda: {
        'value': 8,
        'unit': 'steps',
        'min': 1,
        'max': 32,
        'enabled': True
    })

    # Custom parameters for extensibility
    custom_parameters = Column(JSONB, default=dict)

    # Relationships
    scene = relationship("Scene", back_populates="physics_parameters")

    # Ensure scenes table is created first
    __table_args__ = {'extend_existing': True}

    def update_parameter(self, param_name: str, value: float, enabled: Optional[bool] = None) -> 'PhysicsParameter':
        """Update a physics parameter with validation."""
        param = getattr(self, param_name, None)
        if param and isinstance(param, dict):
            if value is not None:
                if param['min'] <= value <= param['max']:
                    param['value'] = value
                else:
                    raise ValueError(f"Value {value} for {param_name} is outside allowed range [{param['min']}, {param['max']}]")
            if enabled is not None:
                param['enabled'] = enabled
        return self

    def get_effective_parameters(self) -> Dict:
        """Get all enabled parameters with their current values."""
        result = {}
        for param_name in ['gravity', 'air_resistance', 'collision_elasticity', 'friction',
                          'temperature', 'pressure', 'fluid_density', 'viscosity',
                          'time_step', 'substeps']:
            param = getattr(self, param_name)
            if param.get('enabled', True):
                result[param_name] = {
                    'value': param['value'],
                    'unit': param['unit']
                }
        return result

    def add_custom_parameter(self, name: str, value: float, unit: str,
                           min_value: float, max_value: float) -> None:
        """Add a custom physics parameter."""
        self.custom_parameters[name] = {
            'value': value,
            'unit': unit,
            'min': min_value,
            'max': max_value,
            'enabled': True
        }

    def remove_custom_parameter(self, name: str) -> None:
        """Remove a custom physics parameter."""
        self.custom_parameters.pop(name, None)

    def to_dict(self):
        """Convert to dictionary with all parameters."""
        base_dict = {
            "id": self.id,
            "scene_id": self.scene_id,
            "version": self.version,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

        # Add all physics parameters
        for param_name in ['gravity', 'air_resistance', 'collision_elasticity', 'friction',
                          'temperature', 'pressure', 'fluid_density', 'viscosity',
                          'time_step', 'substeps']:
            base_dict[param_name] = getattr(self, param_name)

        # Add custom parameters
        base_dict['custom_parameters'] = self.custom_parameters

        return base_dict

    def __repr__(self):
        """String representation."""
        return f"<PhysicsParameter(id={self.id}, scene_id={self.scene_id}, version={self.version})>"
