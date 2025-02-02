"""
Storyboard schemas.
"""

from typing import Dict, Optional, List
from datetime import datetime
from pydantic import BaseModel, UUID4, Field

from app.models.keyframe import ParameterType
from app.schemas.keyframe import Keyframe

class StoryboardBase(BaseModel):
    """Base storyboard schema."""
    name: str
    description: Optional[str] = None
    settings: Dict = Field(
        default={},
        description="Storyboard settings (zoom level, visible tracks, etc.)"
    )
    metadata: Dict = Field(
        default={},
        description="Additional metadata for UI state and preferences"
    )

class StoryboardCreate(StoryboardBase):
    """Storyboard creation schema."""
    scene_id: UUID4

class Storyboard(StoryboardBase):
    """Storyboard schema."""
    id: UUID4
    scene_id: UUID4
    keyframes: List[Keyframe] = []
    parameter_types: List[ParameterType] = Field(
        default=[],
        description="Types of parameters being animated in this storyboard"
    )
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class StoryboardUpdate(BaseModel):
    """Storyboard update schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[Dict] = None
    metadata: Optional[Dict] = None
    parameter_types: Optional[List[ParameterType]] = None

class StoryboardWithDetails(Storyboard):
    """Storyboard schema with additional details."""
    total_keyframes: int = Field(
        default=0,
        description="Total number of keyframes in the storyboard"
    )
    duration: float = Field(
        default=0.0,
        description="Total duration of the storyboard in seconds"
    )
    active_parameter_types: List[ParameterType] = Field(
        default=[],
        description="Parameter types currently being animated"
    )
