from pydantic import BaseModel, Field
from typing import Dict, Optional
from datetime import datetime

class VisualizationSettings(BaseModel):
    type: str = Field(default="waveform")
    color_scheme: str = Field(default="default")
    resolution: int = Field(default=1080)
    frame_rate: int = Field(default=60)
    effects: Dict[str, float] = Field(default_factory=dict)

class VisualizationBase(BaseModel):
    title: str
    type: str
    settings: VisualizationSettings
    project_id: Optional[int] = None
    audio_file_id: Optional[int] = None

class VisualizationCreate(VisualizationBase):
    pass

class VisualizationUpdate(VisualizationBase):
    pass

class Visualization(VisualizationBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
