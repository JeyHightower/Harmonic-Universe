"""
Keyframe schemas.
"""

from typing import Dict, Optional, Union, List
from datetime import datetime
from pydantic import BaseModel, UUID4, Field

from app.models.keyframe import ParameterType

class KeyframeBase(BaseModel):
    """Base keyframe schema."""
    time: float = Field(description="Time in seconds")
    value: Dict = Field(description="Property value at this keyframe")
    easing: str = Field(default="linear", description="Easing function")
    parameter_type: ParameterType
    metadata: Dict = Field(
        default={},
        description="Additional keyframe properties"
    )

class KeyframeCreate(KeyframeBase):
    """Keyframe creation schema."""
    storyboard_id: UUID4
    timeline_id: Optional[UUID4] = None
    animation_id: Optional[UUID4] = None

class Keyframe(KeyframeBase):
    """Keyframe schema."""
    id: UUID4
    storyboard_id: UUID4
    timeline_id: Optional[UUID4] = None
    animation_id: Optional[UUID4] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class KeyframeUpdate(BaseModel):
    """Keyframe update schema."""
    time: Optional[float] = None
    value: Optional[Dict] = None
    easing: Optional[str] = None
    parameter_type: Optional[ParameterType] = None
    metadata: Optional[Dict] = None

class KeyframeGroup(BaseModel):
    """Group of related keyframes."""
    parameter_type: ParameterType
    keyframes: List[Keyframe]
    metadata: Dict = Field(default={}, description="Group metadata")

    class Config:
        from_attributes = True
