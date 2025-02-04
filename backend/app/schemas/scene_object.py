"""
Scene object schemas.
"""

from typing import Dict, List, Optional, Any, TYPE_CHECKING
from datetime import datetime
from pydantic import UUID4, BaseModel, Field
from uuid import UUID
from app.models.visualization.scene_object import SceneObjectType

if TYPE_CHECKING:
    from app.schemas.scene import Scene

class SceneObjectBase(BaseModel):
    """Base scene object schema."""
    type: SceneObjectType
    name: str
    properties: Dict = {}
    meta_data: Dict = {}

class SceneObjectCreate(SceneObjectBase):
    """Scene object creation schema."""
    scene_id: UUID4

class SceneObjectUpdate(SceneObjectBase):
    """Scene object update schema."""
    name: Optional[str] = None
    properties: Optional[Dict] = None
    meta_data: Optional[Dict] = None

class SceneObjectInDBBase(SceneObjectBase):
    """Base DB scene object schema."""
    id: UUID4
    scene_id: UUID4

    class Config:
        from_attributes = True

class SceneObject(SceneObjectInDBBase):
    """Complete scene object schema."""
    created_at: datetime
    updated_at: datetime

class SceneObjectInDB(SceneObjectInDBBase):
    """DB scene object schema."""
    pass

class SceneObjectResponse(SceneObject):
    """Scene object response schema."""
    scene: "Scene"

    class Config:
        from_attributes = True

class SceneObjectWithParameters(SceneObjectResponse):
    """Scene object response schema with detailed parameters."""
    physics_parameters: Dict = {}
    music_parameters: Dict = {}

    class Config:
        from_attributes = True
