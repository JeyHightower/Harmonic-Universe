"""
Keyframe schemas.
"""

from typing import Dict, List, Optional, Any, TYPE_CHECKING
from datetime import datetime
from pydantic import UUID4, BaseModel, Field
from uuid import UUID
from app.models.visualization.keyframe import ParameterType

class KeyframeBase(BaseModel):
    """Base keyframe schema."""
    time: float
    value: float
    parameter_type: ParameterType
    easing: str = "linear"
    metadata: Dict = {}

class KeyframeCreate(KeyframeBase):
    """Keyframe creation schema."""
    storyboard_id: UUID4

class Keyframe(KeyframeBase):
    """Keyframe schema."""
    id: UUID4
    storyboard_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class KeyframeUpdate(BaseModel):
    """Keyframe update schema."""
    time: Optional[float] = None
    value: Optional[float] = None
    easing: Optional[str] = None
    metadata: Optional[Dict] = None

class KeyframeGroup(BaseModel):
    """Group of keyframes for a parameter type."""
    parameter_type: ParameterType
    keyframes: List[Keyframe] = []

    class Config:
        from_attributes = True
