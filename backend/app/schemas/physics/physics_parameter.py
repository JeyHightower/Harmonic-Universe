"""
Physics parameter schemas.
"""

from typing import Optional
from pydantic import BaseModel, Field

class PhysicsParameterBase(BaseModel):
    """Base physics parameter schema."""
    gravity: float = Field(default=9.81, description="Gravity acceleration in m/s²")
    air_resistance: float = Field(default=0.1, description="Air resistance coefficient")
    collision_elasticity: float = Field(
        default=0.7,
        ge=0.0,
        le=1.0,
        description="Collision elasticity coefficient (0-1)"
    )
    friction: float = Field(
        default=0.3,
        ge=0.0,
        le=1.0,
        description="Friction coefficient (0-1)"
    )

class PhysicsParameterCreate(PhysicsParameterBase):
    """Schema for creating physics parameters."""
    scene_id: int = Field(..., description="ID of the scene these parameters belong to")

class PhysicsParameterUpdate(PhysicsParameterBase):
    """Schema for updating physics parameters."""
    gravity: Optional[float] = None
    air_resistance: Optional[float] = None
    collision_elasticity: Optional[float] = None
    friction: Optional[float] = None

class PhysicsParameterResponse(PhysicsParameterBase):
    """Schema for physics parameter responses."""
    id: int
    scene_id: int

    class Config:
        """Pydantic config."""
        from_attributes = True
