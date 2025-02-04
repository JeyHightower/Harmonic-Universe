"""
MIDI file schemas.
"""

from typing import Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, UUID4
from uuid import UUID

class MIDIFileBase(BaseModel):
    """Base MIDI file schema."""
    name: str
    format: str
    type: str
    duration: float
    metadata: Optional[Dict] = {}

class MIDIFileCreate(MIDIFileBase):
    """MIDI file creation schema."""
    scene_id: UUID4

class MIDIFileUpdate(BaseModel):
    """MIDI file update schema."""
    name: Optional[str] = None
    format: Optional[str] = None
    type: Optional[str] = None
    duration: Optional[float] = None
    metadata: Optional[Dict] = None

class MIDIFileInDBBase(MIDIFileBase):
    """Base schema for MIDI files in DB."""
    id: UUID4
    scene_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MIDIFile(MIDIFileInDBBase):
    """MIDI file schema."""
    pass

class MIDIFileWithEvents(MIDIFile):
    """MIDI file schema with associated events."""
    events_count: int = 0
    total_duration: float = 0.0
    events: Optional[List[Dict]] = None
