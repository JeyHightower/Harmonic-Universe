from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class AudioFileBase(BaseModel):
    name: str
    file_path: str
    duration: Optional[float] = None
    format: Optional[str] = None
    universe_id: Optional[UUID] = None

class AudioFileCreate(AudioFileBase):
    pass

class AudioFileUpdate(BaseModel):
    name: Optional[str] = None
    duration: Optional[float] = None
    universe_id: Optional[UUID] = None

class AudioFileResponse(AudioFileBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
