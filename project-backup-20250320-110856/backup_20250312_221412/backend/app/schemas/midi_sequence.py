from pydantic import BaseModel
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime

class MidiSequenceBase(BaseModel):
    name: str
    data: Dict[str, Any]
    duration: Optional[float] = None
    tempo: Optional[int] = None
    universe_id: UUID

class MidiSequenceCreate(MidiSequenceBase):
    pass

class MidiSequenceUpdate(BaseModel):
    name: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    duration: Optional[float] = None
    tempo: Optional[int] = None

class MidiSequenceResponse(MidiSequenceBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
