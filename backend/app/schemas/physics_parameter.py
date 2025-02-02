"""
Physics parameter schemas.
"""

from typing import Dict, Optional, Union, List
from datetime import datetime
from pydantic import BaseModel, UUID4, Field
import enum

class PhysicsParameterType(str, enum.Enum):
    """Physics parameter type enum."""
    FORCE = "force"
    VELOCITY = "velocity"
    ACCELERATION = "acceleration"
    MASS = "mass"
    GRAVITY = "gravity"
    CONSTRAINT = "constraint"
    COLLISION = "collision"
    CUSTOM = "custom"

class PhysicsParameterBase(BaseModel):
    """Base physics parameter schema."""
    name: str
    type: PhysicsParameterType
    value: Union[float, Dict, List] = Field(description="Parameter value - can be a number, vector, or complex data")
    units: Optional[str] = None
    range: Optional[Dict[str, float]] = Field(
        default=None,
        description="Optional min/max range for parameter validation"
    )
    settings: Dict = {}  # Additional parameter settings
    metadata_json: Dict = {}  # Metadata for visualization and other purposes

class PhysicsParameterCreate(PhysicsParameterBase):
    """Physics parameter creation schema."""
    scene_id: UUID4

class PhysicsParameter(PhysicsParameterBase):
    """Physics parameter schema."""
    id: UUID4
    scene_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PhysicsParameterUpdate(BaseModel):
    """Physics parameter update schema."""
    name: Optional[str] = None
    value: Optional[Union[float, Dict, List]] = None
    units: Optional[str] = None
    range: Optional[Dict[str, float]] = None
    settings: Optional[Dict] = None
    metadata_json: Optional[Dict] = None

class PhysicsParameterGroup(BaseModel):
    """Group of related physics parameters."""
    id: UUID4
    name: str
    parameters: List[PhysicsParameter]
    metadata_json: Dict = {}
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
