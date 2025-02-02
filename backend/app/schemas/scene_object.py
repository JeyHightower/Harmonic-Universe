"""
Scene object schemas.
"""

from typing import Dict, Optional
from datetime import datetime
from pydantic import BaseModel, UUID4

from app.models.scene import SceneObjectType

class SceneObjectBase(BaseModel):
    """Base scene object schema."""
    type: SceneObjectType
    name: str
    properties: Dict = {}
    metadata: Dict = {}

class SceneObjectCreate(SceneObjectBase):
    """Scene object creation schema."""
    scene_id: UUID4

class SceneObject(SceneObjectBase):
    """Scene object schema."""
    id: UUID4
    scene_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SceneObjectUpdate(BaseModel):
    """Scene object update schema."""
    name: Optional[str] = None
    properties: Optional[Dict] = None
    metadata: Optional[Dict] = None
