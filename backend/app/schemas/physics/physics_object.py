"""
Physics object schemas.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
import numpy as np

class Vector3D(BaseModel):
    """3D vector schema."""
    x: float = Field(default=0.0)
    y: float = Field(default=0.0)
    z: float = Field(default=0.0)

    def to_list(self) -> List[float]:
        """Convert to list format."""
        return [self.x, self.y, self.z]

    def to_numpy(self) -> np.ndarray:
        """Convert to numpy array."""
        return np.array([self.x, self.y, self.z])

    @classmethod
    def from_list(cls, values: List[float]) -> 'Vector3D':
        """Create from list."""
        return cls(x=values[0], y=values[1], z=values[2])

class PhysicsObjectBase(BaseModel):
    """Base physics object schema."""
    name: str = Field(..., description="Name of the physics object")
    mass: float = Field(default=1.0, gt=0.0, description="Mass in kg")
    position: Vector3D = Field(default_factory=Vector3D, description="Position in 3D space")
    velocity: Vector3D = Field(default_factory=Vector3D, description="Velocity vector")
    acceleration: Vector3D = Field(default_factory=Vector3D, description="Acceleration vector")
    rotation: Vector3D = Field(default_factory=Vector3D, description="Rotation in degrees")
    angular_velocity: Vector3D = Field(default_factory=Vector3D, description="Angular velocity")
    scale: Vector3D = Field(
        default_factory=lambda: Vector3D(x=1.0, y=1.0, z=1.0),
        description="Scale in each dimension"
    )
    is_static: bool = Field(default=False, description="Whether the object is static")
    is_trigger: bool = Field(default=False, description="Whether the object is a trigger volume")
    collision_shape: str = Field(default="box", description="Type of collision shape")
    collision_params: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional collision shape parameters"
    )
    material_properties: Dict[str, Any] = Field(
        default_factory=lambda: {
            "restitution": 0.7,
            "friction": 0.3,
            "density": 1.0
        },
        description="Physical material properties"
    )

    @validator('collision_shape')
    def validate_collision_shape(cls, v):
        """Validate collision shape type."""
        allowed_shapes = ['box', 'sphere', 'capsule', 'cylinder', 'mesh']
        if v not in allowed_shapes:
            raise ValueError(f"Collision shape must be one of: {allowed_shapes}")
        return v

class PhysicsObjectCreate(PhysicsObjectBase):
    """Schema for creating physics objects."""
    scene_id: int = Field(..., description="ID of the scene this object belongs to")

class PhysicsObjectUpdate(BaseModel):
    """Schema for updating physics objects."""
    name: Optional[str] = None
    mass: Optional[float] = None
    position: Optional[Vector3D] = None
    velocity: Optional[Vector3D] = None
    acceleration: Optional[Vector3D] = None
    rotation: Optional[Vector3D] = None
    angular_velocity: Optional[Vector3D] = None
    scale: Optional[Vector3D] = None
    is_static: Optional[bool] = None
    is_trigger: Optional[bool] = None
    collision_shape: Optional[str] = None
    collision_params: Optional[Dict[str, Any]] = None
    material_properties: Optional[Dict[str, Any]] = None

class PhysicsObjectResponse(PhysicsObjectBase):
    """Schema for physics object responses."""
    id: int
    scene_id: int

    class Config:
        """Pydantic config."""
        from_attributes = True
