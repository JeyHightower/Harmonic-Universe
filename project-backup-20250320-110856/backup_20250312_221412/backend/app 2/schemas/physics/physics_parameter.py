"""
Physics parameter schemas for request/response validation.
"""

from typing import Any, Dict, Optional, List
from pydantic import BaseModel, Field, validator
from uuid import UUID

class PhysicsParameterValue(BaseModel):
    """Structure for a physics parameter value."""
    value: float = Field(..., description="Current value of the parameter")
    unit: str = Field(..., description="Unit of measurement")
    min: float = Field(..., description="Minimum allowed value")
    max: float = Field(..., description="Maximum allowed value")
    enabled: bool = Field(default=True, description="Whether the parameter is enabled")

class PhysicsParameterBase(BaseModel):
    """Base physics parameters."""
    scene_id: UUID
    version: Optional[int] = Field(default=1, description="Version of the parameters")
    is_active: Optional[bool] = Field(default=True, description="Whether the parameters are active")

    # Basic physics parameters
    gravity: PhysicsParameterValue = Field(
        default_factory=lambda: {
            "value": 9.81,
            "unit": "m/s²",
            "min": 0,
            "max": 20,
            "enabled": True
        }
    )
    air_resistance: PhysicsParameterValue = Field(
        default_factory=lambda: {
            "value": 0.1,
            "unit": "kg/m³",
            "min": 0,
            "max": 1,
            "enabled": True
        }
    )
    collision_elasticity: PhysicsParameterValue = Field(
        default_factory=lambda: {
            "value": 0.7,
            "unit": "coefficient",
            "min": 0,
            "max": 1,
            "enabled": True
        }
    )
    friction: PhysicsParameterValue = Field(
        default_factory=lambda: {
            "value": 0.3,
            "unit": "coefficient",
            "min": 0,
            "max": 1,
            "enabled": True
        }
    )

    # Advanced physics parameters
    temperature: PhysicsParameterValue = Field(
        default_factory=lambda: {
            "value": 293.15,
            "unit": "K",
            "min": 0,
            "max": 1000,
            "enabled": True
        }
    )
    pressure: PhysicsParameterValue = Field(
        default_factory=lambda: {
            "value": 101.325,
            "unit": "kPa",
            "min": 0,
            "max": 200,
            "enabled": True
        }
    )

    # Fluid dynamics parameters
    fluid_density: PhysicsParameterValue = Field(
        default_factory=lambda: {
            "value": 1.225,
            "unit": "kg/m³",
            "min": 0,
            "max": 2000,
            "enabled": False
        }
    )
    viscosity: PhysicsParameterValue = Field(
        default_factory=lambda: {
            "value": 1.81e-5,
            "unit": "Pa·s",
            "min": 0,
            "max": 1,
            "enabled": False
        }
    )

    # Simulation parameters
    time_step: PhysicsParameterValue = Field(
        default_factory=lambda: {
            "value": 0.016,
            "unit": "s",
            "min": 0.001,
            "max": 0.1,
            "enabled": True
        }
    )
    substeps: PhysicsParameterValue = Field(
        default_factory=lambda: {
            "value": 8,
            "unit": "steps",
            "min": 1,
            "max": 32,
            "enabled": True
        }
    )

    # Custom parameters
    custom_parameters: Dict[str, PhysicsParameterValue] = Field(
        default_factory=dict,
        description="Custom physics parameters"
    )

    @validator("*")
    def validate_parameter_values(cls, v, field):
        """Validate parameter values are within bounds."""
        if isinstance(v, PhysicsParameterValue):
            if not (v.min <= v.value <= v.max):
                raise ValueError(
                    f"Value {v.value} for {field.name} must be between {v.min} and {v.max}"
                )
        return v

class PhysicsParameterCreate(PhysicsParameterBase):
    """Properties to receive on parameter creation."""
    pass

class PhysicsParameterUpdate(BaseModel):
    """Properties to receive on parameter update."""
    version: Optional[int] = None
    is_active: Optional[bool] = None
    gravity: Optional[PhysicsParameterValue] = None
    air_resistance: Optional[PhysicsParameterValue] = None
    collision_elasticity: Optional[PhysicsParameterValue] = None
    friction: Optional[PhysicsParameterValue] = None
    temperature: Optional[PhysicsParameterValue] = None
    pressure: Optional[PhysicsParameterValue] = None
    fluid_density: Optional[PhysicsParameterValue] = None
    viscosity: Optional[PhysicsParameterValue] = None
    time_step: Optional[PhysicsParameterValue] = None
    substeps: Optional[PhysicsParameterValue] = None
    custom_parameters: Optional[Dict[str, PhysicsParameterValue]] = None

class PhysicsParameterInDBBase(PhysicsParameterBase):
    """Properties shared by models stored in DB."""
    id: int

    class Config:
        """Pydantic configuration."""
        from_attributes = True

class PhysicsParameterResponse(PhysicsParameterInDBBase):
    """Properties to return to client."""
    pass
