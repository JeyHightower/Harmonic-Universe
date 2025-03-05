"""
Audio track schemas for request/response validation.
"""

from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field
from .midi import MIDISequence
from backend.app.models.audio.audio_control import AutomationType

class AudioMarkerBase(BaseModel):
    """Shared properties for audio markers."""
    name: str = Field(..., description="Name of the marker")
    time: float = Field(..., ge=0, description="Time position in seconds")
    color: Optional[str] = Field(None, description="Color of the marker")
    description: Optional[str] = Field(None, description="Marker description")
    parameters: Dict = Field(default_factory=dict, description="Additional parameters")

class AudioMarkerCreate(AudioMarkerBase):
    """Properties to receive on marker creation."""
    track_id: int = Field(..., description="ID of the parent track")

class AudioMarkerUpdate(BaseModel):
    """Properties to receive on marker update."""
    name: Optional[str] = None
    time: Optional[float] = None
    color: Optional[str] = None
    description: Optional[str] = None
    parameters: Optional[Dict] = None

class AudioMarkerInDBBase(AudioMarkerBase):
    """Properties shared by models stored in DB."""
    id: int
    track_id: int

    class Config:
        """Pydantic configuration."""
        from_attributes = True

class AudioMarker(AudioMarkerInDBBase):
    """Properties to return to client."""
    pass

class AutomationPoint(BaseModel):
    """Point in an automation curve."""
    time: float = Field(..., ge=0, description="Time position in seconds")
    value: float = Field(..., description="Parameter value at this point")

class AudioAutomationBase(BaseModel):
    """Shared properties for audio automation."""
    parameter_type: AutomationType = Field(..., description="Type of automated parameter")
    target_id: Optional[str] = Field(None, description="Target parameter ID for effects")
    points: List[AutomationPoint] = Field(default_factory=list, description="Automation points")
    curve_type: str = Field(default="linear", description="Interpolation curve type")
    enabled: bool = Field(default=True, description="Whether automation is enabled")
    parameters: Dict = Field(default_factory=dict, description="Additional parameters")

class AudioAutomationCreate(AudioAutomationBase):
    """Properties to receive on automation creation."""
    track_id: int = Field(..., description="ID of the parent track")

class AudioAutomationUpdate(BaseModel):
    """Properties to receive on automation update."""
    parameter_type: Optional[AutomationType] = None
    target_id: Optional[str] = None
    points: Optional[List[AutomationPoint]] = None
    curve_type: Optional[str] = None
    enabled: Optional[bool] = None
    parameters: Optional[Dict] = None

class AudioAutomationInDBBase(AudioAutomationBase):
    """Properties shared by models stored in DB."""
    id: int
    track_id: int

    class Config:
        """Pydantic configuration."""
        from_attributes = True

class AudioAutomation(AudioAutomationInDBBase):
    """Properties to return to client."""
    pass

class AudioEffectBase(BaseModel):
    """Audio effect configuration."""
    type: str = Field(..., description="Type of audio effect")
    enabled: bool = Field(default=True, description="Whether effect is enabled")
    parameters: Dict = Field(default_factory=dict, description="Effect parameters")

class AudioTrackBase(BaseModel):
    """Shared properties for audio tracks."""
    name: str = Field(..., description="Name of the track")
    file_path: str = Field(..., description="Path to audio file")
    file_type: str = Field(..., description="Audio file type")
    duration: float = Field(..., gt=0, description="Track duration in seconds")
    sample_rate: int = Field(..., gt=0, description="Sample rate in Hz")
    channels: int = Field(..., gt=0, description="Number of audio channels")
    is_muted: bool = Field(default=False, description="Whether track is muted")
    volume: float = Field(default=1.0, ge=0, description="Track volume")
    pan: float = Field(default=0.0, ge=-1, le=1, description="Track pan position")
    start_time: float = Field(default=0.0, ge=0, description="Track start time")
    end_time: Optional[float] = Field(None, description="Track end time")
    loop_enabled: bool = Field(default=False, description="Whether track should loop")
    effects: List[AudioEffectBase] = Field(default_factory=list, description="Audio effects chain")
    parameters: Dict = Field(default_factory=dict, description="Additional parameters")

class AudioTrackCreate(AudioTrackBase):
    """Properties to receive on track creation."""
    scene_id: int = Field(..., description="ID of the parent scene")
    midi_sequence_id: Optional[int] = Field(None, description="ID of associated MIDI sequence")

class AudioTrackUpdate(BaseModel):
    """Properties to receive on track update."""
    name: Optional[str] = None
    is_muted: Optional[bool] = None
    volume: Optional[float] = None
    pan: Optional[float] = None
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    loop_enabled: Optional[bool] = None
    effects: Optional[List[AudioEffectBase]] = None
    parameters: Optional[Dict] = None

class AudioTrackInDBBase(AudioTrackBase):
    """Properties shared by models stored in DB."""
    id: int
    scene_id: int
    midi_sequence_id: Optional[int]

    class Config:
        """Pydantic configuration."""
        from_attributes = True

class AudioTrack(AudioTrackInDBBase):
    """Properties to return to client."""
    midi_sequence: Optional[MIDISequence] = None
    markers: List[AudioMarker] = []
    automation: List[AudioAutomation] = []
