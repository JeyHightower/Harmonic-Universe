from typing import Optional, Dict, List
from pydantic import BaseModel, UUID4
from datetime import datetime
from app.models.audio_file import AudioFormat, AudioType

class AudioFileBase(BaseModel):
    name: str
    description: Optional[str] = None
    format: AudioFormat
    type: AudioType
    duration: Optional[float] = None
    sample_rate: Optional[int] = None
    channels: Optional[int] = None
    bit_depth: Optional[int] = None
    waveform_data: Optional[Dict] = None
    metadata: Dict = {}

class AudioFileCreate(AudioFileBase):
    universe_id: UUID4
    generation_id: Optional[UUID4] = None
    file_path: str
    file_size: int

class AudioFileUpdate(AudioFileBase):
    name: Optional[str] = None
    description: Optional[str] = None
    waveform_data: Optional[Dict] = None
    metadata: Optional[Dict] = None

class AudioFileInDBBase(AudioFileBase):
    id: UUID4
    universe_id: UUID4
    generation_id: Optional[UUID4]
    file_path: str
    file_size: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AudioFile(AudioFileInDBBase):
    pass

class AudioFileWithDetails(AudioFile):
    # Add additional fields for detailed view
    midi_events_count: Optional[int] = 0
    scenes_count: Optional[int] = 0
    processing_status: Optional[str] = None
    analysis_data: Optional[Dict] = None
    last_modified: Optional[datetime] = None
    usage_stats: Optional[Dict] = None
    related_files: Optional[List[Dict]] = []

class AudioFileInDB(AudioFileInDBBase):
    pass
