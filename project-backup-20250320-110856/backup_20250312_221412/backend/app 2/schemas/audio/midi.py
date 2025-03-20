"""
MIDI schemas for request/response validation.
"""

from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field

class MIDIEventBase(BaseModel):
    """Shared properties for MIDI events."""
    event_type: str = Field(..., description="Type of MIDI event")
    channel: int = Field(..., ge=0, le=15, description="MIDI channel")
    timestamp: float = Field(..., ge=0, description="Time in seconds from sequence start")
    note: Optional[int] = Field(None, ge=0, le=127, description="MIDI note number")
    velocity: Optional[int] = Field(None, ge=0, le=127, description="Note velocity")
    control_number: Optional[int] = Field(None, ge=0, le=127, description="Control change number")
    control_value: Optional[int] = Field(None, ge=0, le=127, description="Control change value")
    duration: Optional[float] = Field(None, ge=0, description="Note duration in seconds")
    parameters: Dict = Field(default_factory=dict, description="Additional parameters")

class MIDIEventCreate(MIDIEventBase):
    """Properties to receive on event creation."""
    sequence_id: int = Field(..., description="ID of the parent sequence")

class MIDIEventUpdate(BaseModel):
    """Properties to receive on event update."""
    event_type: Optional[str] = None
    channel: Optional[int] = None
    timestamp: Optional[float] = None
    note: Optional[int] = None
    velocity: Optional[int] = None
    control_number: Optional[int] = None
    control_value: Optional[int] = None
    duration: Optional[float] = None
    parameters: Optional[Dict] = None

class MIDIEventInDBBase(MIDIEventBase):
    """Properties shared by models stored in DB."""
    id: int
    sequence_id: int

    class Config:
        """Pydantic configuration."""
        from_attributes = True

class MIDIEvent(MIDIEventInDBBase):
    """Properties to return to client."""
    pass

class MIDISequenceBase(BaseModel):
    """Shared properties for MIDI sequences."""
    name: str = Field(..., description="Name of the sequence")
    tempo: float = Field(default=120.0, gt=0, description="Tempo in BPM")
    time_signature: str = Field(default="4/4", description="Time signature")
    is_loop: bool = Field(default=False, description="Whether sequence should loop")
    loop_start: float = Field(default=0.0, ge=0, description="Loop start time in seconds")
    loop_end: Optional[float] = Field(None, description="Loop end time in seconds")
    quantization: float = Field(default=0.0, ge=0, description="Quantization value in seconds")
    parameters: Dict = Field(default_factory=dict, description="Additional parameters")

class MIDISequenceCreate(MIDISequenceBase):
    """Properties to receive on sequence creation."""
    scene_id: int = Field(..., description="ID of the parent scene")

class MIDISequenceUpdate(BaseModel):
    """Properties to receive on sequence update."""
    name: Optional[str] = None
    tempo: Optional[float] = None
    time_signature: Optional[str] = None
    is_loop: Optional[bool] = None
    loop_start: Optional[float] = None
    loop_end: Optional[float] = None
    quantization: Optional[float] = None
    parameters: Optional[Dict] = None

class MIDISequenceInDBBase(MIDISequenceBase):
    """Properties shared by models stored in DB."""
    id: int
    scene_id: int

    class Config:
        """Pydantic configuration."""
        from_attributes = True

class MIDISequence(MIDISequenceInDBBase):
    """Properties to return to client."""
    events: List[MIDIEvent] = []
