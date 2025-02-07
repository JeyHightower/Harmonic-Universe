from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class AudioFileBase(BaseModel):
    filename: str
    file_path: str
    file_type: str = Field(default="wav")
    duration: float
    sample_rate: int = Field(default=44100)
    channels: int = Field(default=2)
    project_id: Optional[int] = None

class AudioFileCreate(AudioFileBase):
    pass

class AudioFileUpdate(AudioFileBase):
    pass

class AudioFile(AudioFileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
