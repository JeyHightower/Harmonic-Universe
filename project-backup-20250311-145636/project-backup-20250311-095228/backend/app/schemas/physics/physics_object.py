"""
Physics object schemas for request/response validation.
"""

from typing import Dict, Optional
from pydantic import BaseModel, Field


class Vector3D(BaseModel):
    """3D vector representation."""

    x: float = Field(default=0.0, description="X coordinate")
    y: float = Field(default=0.0, description="Y coordinate")
    z: float = Field(default=0.0, description="Z coordinate")


class MaterialProperties(BaseModel):
    """Physical material properties."""

    restitution: float = Field(default=0.7, description="Coefficient of restitution")
    friction: float = Field(default=0.3, description="Coefficient of friction")
    density: float = Field(default=1.0, description="Material density")


class PhysicsObjectBase(BaseModel):
    """Shared properties for physics objects."""

    name: str = Field(..., description="Name of the physics object")
    mass: float = Field(default=1.0, description="Mass of the object")
    position: Vector3D = Field(
        default_factory=Vector3D, description="Position in 3D space"
    )
    velocity: Vector3D = Field(default_factory=Vector3D, description="Velocity vector")
    acceleration: Vector3D = Field(
        default_factory=Vector3D, description="Acceleration vector"
    )
    rotation: Vector3D = Field(
        default_factory=Vector3D, description="Rotation in euler angles"
    )
    angular_velocity: Vector3D = Field(
        default_factory=Vector3D, description="Angular velocity vector"
    )
    scale: Vector3D = Field(
        default_factory=lambda: Vector3D(x=1.0, y=1.0, z=1.0), description="Scale in 3D"
    )
    is_static: bool = Field(default=False, description="Whether the object is static")
    is_trigger: bool = Field(
        default=False, description="Whether the object is a trigger volume"
    )
    collision_shape: str = Field(
        default="box", description="Shape of the collision volume"
    )
    collision_params: Dict = Field(
        default_factory=dict, description="Additional collision parameters"
    )
    material_properties: MaterialProperties = Field(
        default_factory=MaterialProperties, description="Material properties"
    )


class PhysicsObjectCreate(PhysicsObjectBase):
    """Properties to receive on object creation."""

    scene_id: int = Field(..., description="ID of the scene this object belongs to")


class PhysicsObjectUpdate(PhysicsObjectBase):
    """Properties to receive on object update."""

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
    collision_params: Optional[Dict] = None
    material_properties: Optional[MaterialProperties] = None


class PhysicsObjectInDBBase(PhysicsObjectBase):
    """Properties shared by models stored in DB."""

    id: int
    scene_id: int

    class Config:
        """Pydantic configuration."""

        from_attributes = True


class PhysicsObject(PhysicsObjectInDBBase):
    """Properties to return to client."""

    pass


class PhysicsObjectInDB(PhysicsObjectInDBBase):
    """Properties stored in DB."""

    pass
