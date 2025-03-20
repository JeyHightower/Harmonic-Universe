"""
Physics constraint schemas.
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from .physics_object import Vector3D

class PhysicsConstraintBase(BaseModel):
    """Base physics constraint schema."""
    name: str = Field(..., description="Name of the constraint")
    constraint_type: str = Field(..., description="Type of constraint")
    object_a_id: int = Field(..., description="ID of the first object")
    object_b_id: Optional[int] = Field(None, description="ID of the second object (optional)")
    anchor_a: Vector3D = Field(
        default_factory=Vector3D,
        description="Anchor point on object A in local coordinates"
    )
    anchor_b: Optional[Vector3D] = Field(
        None,
        description="Anchor point on object B in local coordinates"
    )
    axis_a: Vector3D = Field(
        default_factory=lambda: Vector3D(x=0.0, y=1.0, z=0.0),
        description="Primary axis for object A"
    )
    axis_b: Optional[Vector3D] = Field(
        None,
        description="Primary axis for object B"
    )
    limits: Dict[str, Any] = Field(
        default_factory=dict,
        description="Constraint limits and ranges"
    )
    spring_properties: Optional[Dict[str, Any]] = Field(
        None,
        description="Spring properties for spring constraints"
    )
    breaking_force: Optional[float] = Field(
        None,
        gt=0.0,
        description="Force required to break the constraint"
    )
    enabled: bool = Field(
        default=True,
        description="Whether the constraint is currently enabled"
    )

    @validator('constraint_type')
    def validate_constraint_type(cls, v):
        """Validate constraint type."""
        allowed_types = [
            'fixed',
            'hinge',
            'slider',
            'spring',
            'ball_socket',
            'distance',
            'cone_twist'
        ]
        if v not in allowed_types:
            raise ValueError(f"Constraint type must be one of: {allowed_types}")
        return v

    @validator('limits')
    def validate_limits(cls, v, values):
        """Validate limits based on constraint type."""
        constraint_type = values.get('constraint_type')
        if constraint_type:
            if constraint_type == 'hinge':
                required_fields = ['min_angle', 'max_angle']
            elif constraint_type == 'slider':
                required_fields = ['min_distance', 'max_distance']
            elif constraint_type == 'distance':
                required_fields = ['min_distance', 'max_distance']
            elif constraint_type == 'cone_twist':
                required_fields = ['swing_span1', 'swing_span2', 'twist_span']
            else:
                required_fields = []

            for field in required_fields:
                if field not in v:
                    raise ValueError(
                        f"Constraint type '{constraint_type}' requires '{field}' in limits"
                    )
        return v

class PhysicsConstraintCreate(PhysicsConstraintBase):
    """Schema for creating physics constraints."""
    scene_id: int = Field(..., description="ID of the scene this constraint belongs to")

class PhysicsConstraintUpdate(BaseModel):
    """Schema for updating physics constraints."""
    name: Optional[str] = None
    anchor_a: Optional[Vector3D] = None
    anchor_b: Optional[Vector3D] = None
    axis_a: Optional[Vector3D] = None
    axis_b: Optional[Vector3D] = None
    limits: Optional[Dict[str, Any]] = None
    spring_properties: Optional[Dict[str, Any]] = None
    breaking_force: Optional[float] = None
    enabled: Optional[bool] = None

class PhysicsConstraintResponse(PhysicsConstraintBase):
    """Schema for physics constraint responses."""
    id: int
    scene_id: int

    class Config:
        """Pydantic config."""
        from_attributes = True
