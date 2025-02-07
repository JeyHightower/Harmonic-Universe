"""
Physics parameter schemas for request/response validation.
"""

from typing import Any, Dict, Optional, Union
from pydantic import BaseModel, Field

class PhysicsParameterBase(BaseModel):
    """Shared properties for physics parameters."""
    name: str = Field(..., description="Name of the parameter")
    parameter_type: str = Field(..., description="Type of parameter (scalar, vector, etc.)")
    value: Union[float, Dict[str, float]] = Field(..., description="Parameter value")
    min_value: Optional[Union[float, Dict[str, float]]] = Field(None, description="Minimum allowed value")
    max_value: Optional[Union[float, Dict[str, float]]] = Field(None, description="Maximum allowed value")
    units: Optional[str] = Field(None, description="Units of measurement")
    description: Optional[str] = Field(None, description="Parameter description")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

class PhysicsParameterCreate(PhysicsParameterBase):
    """Properties to receive on parameter creation."""
    object_id: int = Field(..., description="ID of the physics object this parameter belongs to")

class PhysicsParameterUpdate(PhysicsParameterBase):
    """Properties to receive on parameter update."""
    name: Optional[str] = None
    parameter_type: Optional[str] = None
    value: Optional[Union[float, Dict[str, float]]] = None
    min_value: Optional[Union[float, Dict[str, float]]] = None
    max_value: Optional[Union[float, Dict[str, float]]] = None
    units: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class PhysicsParameterInDBBase(PhysicsParameterBase):
    """Properties shared by models stored in DB."""
    id: int
    object_id: int

    class Config:
        """Pydantic configuration."""
        from_attributes = True

class PhysicsParameter(PhysicsParameterInDBBase):
    """Properties to return to client."""
    pass

class PhysicsParameterInDB(PhysicsParameterInDBBase):
    """Properties stored in DB."""
    pass
