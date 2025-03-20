from pydantic import BaseModel
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime

class AudioTrackBase(BaseModel):
    name: str
    type: str
    parameters: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = True
    universe_id: UUID

class AudioTrackCreate(AudioTrackBase):
    pass

class AudioTrackUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class AudioTrackResponse(AudioTrackBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
