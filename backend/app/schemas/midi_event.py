from typing import Optional, List
from pydantic import BaseModel, UUID4
from app.models.audio.midi_event import MidiEventType

class MIDIEventBase(BaseModel):
    event_type: MidiEventType
    timestamp: float
    channel: Optional[int] = None
    note: Optional[int] = None
    velocity: Optional[int] = None
    control: Optional[int] = None
    value: Optional[int] = None
    event_metadata: Optional[dict] = {}

class MIDIEventCreate(MIDIEventBase):
    audio_file_id: UUID4

class MIDIEventUpdate(MIDIEventBase):
    pass

class MIDIEventInDBBase(MIDIEventBase):
    id: UUID4
    audio_file_id: UUID4

    class Config:
        from_attributes = True

class MIDIEvent(MIDIEventInDBBase):
    pass

class MIDIEventBatch(BaseModel):
    events: List[MIDIEventCreate]
