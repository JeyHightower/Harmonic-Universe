"""
Storyboard schemas.
"""

from typing import Dict, List, Optional, Any, TYPE_CHECKING
from datetime import datetime
from pydantic import UUID4, BaseModel, Field
from uuid import UUID
from app.models.visualization.keyframe import ParameterType
from app.schemas.keyframe import Keyframe

class StoryboardBase(BaseModel):
    """Base storyboard schema."""
    name: str
    description: Optional[str] = None
    metadata: Dict = {}

class StoryboardCreate(StoryboardBase):
    """Storyboard creation schema."""
    scene_id: UUID4

class Storyboard(StoryboardBase):
    """Storyboard schema."""
    id: UUID4
    scene_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class StoryboardUpdate(BaseModel):
    """Storyboard update schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[Dict] = None

class StoryboardWithDetails(Storyboard):
    """Storyboard schema with keyframes."""
    keyframes: List[Keyframe] = []

    class Config:
        from_attributes = True
