from typing import Optional, Dict, List
from pydantic import BaseModel, UUID4
from datetime import datetime
from app.models.keyframe import ParameterType

class TimelineBase(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration: float
    fps: int = 60
    markers: List[Dict] = []
    timeline_metadata: Dict = {}

class TimelineCreate(TimelineBase):
    scene_id: UUID4

class TimelineUpdate(TimelineBase):
    name: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[float] = None
    fps: Optional[int] = None
    markers: Optional[List[Dict]] = None
    timeline_metadata: Optional[Dict] = None

class TimelineInDBBase(TimelineBase):
    id: UUID4
    scene_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Timeline(TimelineInDBBase):
    pass

class KeyframeBase(BaseModel):
    time: float
    value: Dict
    easing: str = "linear"
    parameter_type: ParameterType
    keyframe_metadata: Dict = {}

class KeyframeCreate(KeyframeBase):
    timeline_id: UUID4
    animation_id: UUID4

class KeyframeUpdate(KeyframeBase):
    time: Optional[float] = None
    value: Optional[Dict] = None
    easing: Optional[str] = None
    parameter_type: Optional[ParameterType] = None
    keyframe_metadata: Optional[Dict] = None

class KeyframeInDBBase(KeyframeBase):
    id: UUID4
    timeline_id: UUID4
    animation_id: UUID4
    created_at: datetime

    class Config:
        from_attributes = True

class Keyframe(KeyframeInDBBase):
    pass

class AnimationBase(BaseModel):
    property_name: str
    interpolation: str = "linear"
    loop: bool = False
    animation_metadata: Dict = {}

class AnimationCreate(AnimationBase):
    object_id: UUID4

class AnimationUpdate(AnimationBase):
    property_name: Optional[str] = None
    interpolation: Optional[str] = None
    loop: Optional[bool] = None
    animation_metadata: Optional[Dict] = None

class AnimationInDBBase(AnimationBase):
    id: UUID4
    object_id: UUID4
    created_at: datetime

    class Config:
        from_attributes = True

class Animation(AnimationInDBBase):
    pass

class ExportBase(BaseModel):
    name: str
    type: str  # video, scene, parameters
    format: str  # mp4, json, etc.
    file_path: str
    settings: Optional[Dict] = None
    status: str = "pending"
    progress: float = 0.0
    export_metadata: Dict = {}

class ExportCreate(ExportBase):
    scene_id: UUID4

class ExportUpdate(ExportBase):
    name: Optional[str] = None
    type: Optional[str] = None
    format: Optional[str] = None
    file_path: Optional[str] = None
    settings: Optional[Dict] = None
    status: Optional[str] = None
    progress: Optional[float] = None
    export_metadata: Optional[Dict] = None

class ExportInDBBase(ExportBase):
    id: UUID4
    scene_id: UUID4
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Export(ExportInDBBase):
    pass
