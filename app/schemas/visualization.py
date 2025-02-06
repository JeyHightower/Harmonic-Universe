"""Visualization schemas."""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
import enum

from app.schemas.base import BaseSchema

class ParameterType(str, enum.Enum):
    """Parameter type enum for keyframes."""
    TRANSFORM = "transform"
    MATERIAL = "material"
    CAMERA = "camera"
    LIGHT = "light"
    PHYSICS = "physics"
    AUDIO = "audio"
    CUSTOM = "custom"

# Base Models
class KeyframeBase(BaseModel):
    """Base keyframe schema."""
    time: float
    value: Dict
    easing: str = "linear"
    parameter_type: ParameterType
    keyframe_metadata: Dict = {}

class TimelineBase(BaseModel):
    """Base timeline schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    duration: float
    fps: int = 60
    markers: List[Dict] = []
    timeline_metadata: Dict = {}

class AnimationBase(BaseModel):
    """Base animation schema."""
    property_name: str
    interpolation: str = "linear"
    loop: bool = False
    animation_metadata: Dict = {}

class VisualizationBase(BaseSchema):
    """Base visualization schema."""
    name: str = Field(..., description="Visualization name")
    description: Optional[str] = Field(None, description="Visualization description")
    scene_id: UUID = Field(..., description="ID of the scene this visualization belongs to")
    settings: Dict[str, Any] = Field(default_factory=dict, description="Visualization settings")

class ExportBase(BaseModel):
    """Base export schema."""
    name: str
    type: str  # video, scene, parameters
    format: str  # mp4, json, etc.
    file_path: str
    settings: Optional[Dict] = None
    status: str = "pending"
    progress: float = 0.0
    export_metadata: Dict = {}

# Create Models
class KeyframeCreate(KeyframeBase):
    """Create keyframe schema."""
    timeline_id: UUID
    animation_id: UUID

class TimelineCreate(TimelineBase):
    """Create timeline schema."""
    scene_id: UUID

class AnimationCreate(AnimationBase):
    """Create animation schema."""
    object_id: UUID

class VisualizationCreate(VisualizationBase):
    """Create visualization schema."""
    pass

class ExportCreate(ExportBase):
    """Create export schema."""
    scene_id: UUID

# Update Models
class KeyframeUpdate(KeyframeBase):
    """Update keyframe schema."""
    time: Optional[float] = None
    value: Optional[Dict] = None
    easing: Optional[str] = None
    parameter_type: Optional[ParameterType] = None
    keyframe_metadata: Optional[Dict] = None

class TimelineUpdate(TimelineBase):
    """Update timeline schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[float] = None
    fps: Optional[int] = None
    markers: Optional[List[Dict]] = None
    timeline_metadata: Optional[Dict] = None

class AnimationUpdate(AnimationBase):
    """Update animation schema."""
    property_name: Optional[str] = None
    interpolation: Optional[str] = None
    loop: Optional[bool] = None
    animation_metadata: Optional[Dict] = None

class VisualizationUpdate(VisualizationBase):
    """Update visualization schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    scene_id: Optional[UUID] = None
    settings: Optional[Dict[str, Any]] = None

class ExportUpdate(ExportBase):
    """Update export schema."""
    name: Optional[str] = None
    type: Optional[str] = None
    format: Optional[str] = None
    file_path: Optional[str] = None
    settings: Optional[Dict] = None
    status: Optional[str] = None
    progress: Optional[float] = None
    export_metadata: Optional[Dict] = None

# DB Models
class KeyframeInDBBase(KeyframeBase):
    """Base keyframe in DB schema."""
    id: UUID
    timeline_id: UUID
    animation_id: UUID
    created_at: datetime

    class Config:
        """Pydantic config."""
        from_attributes = True

class TimelineInDBBase(TimelineBase):
    """Base timeline in DB schema."""
    id: UUID
    scene_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""
        from_attributes = True

class AnimationInDBBase(AnimationBase):
    """Base animation in DB schema."""
    id: UUID
    object_id: UUID
    created_at: datetime

    class Config:
        """Pydantic config."""
        from_attributes = True

class VisualizationInDBBase(VisualizationBase):
    """Base visualization in DB schema."""
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""
        orm_mode = True

class ExportInDBBase(ExportBase):
    """Base export in DB schema."""
    id: UUID
    scene_id: UUID
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        """Pydantic config."""
        from_attributes = True

# Final Models
class Keyframe(KeyframeInDBBase):
    """Keyframe schema."""
    pass

class Timeline(TimelineInDBBase):
    """Timeline schema."""
    pass

class Animation(AnimationInDBBase):
    """Animation schema."""
    pass

class Visualization(VisualizationInDBBase):
    """Visualization schema."""
    pass

class Export(ExportInDBBase):
    """Export schema."""
    pass
