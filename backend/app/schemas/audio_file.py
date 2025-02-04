"""
Audio file schemas.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from pydantic import UUID4, BaseModel, Field
from uuid import UUID
from app.models.audio.audio_file import AudioFormat, AudioType

class AudioFileBase(BaseModel):
    """Base audio file schema."""
    name: str
    format: AudioFormat
    type: AudioType
    duration: float
    metadata: Dict = {}

class AudioFileCreate(AudioFileBase):
    """Audio file creation schema."""
    scene_id: UUID4

class AudioFile(AudioFileBase):
    """Audio file schema."""
    id: UUID4
    scene_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AudioFileUpdate(BaseModel):
    """Audio file update schema."""
    name: Optional[str] = None
    format: Optional[AudioFormat] = None
    type: Optional[AudioType] = None
    duration: Optional[float] = None
    metadata: Optional[Dict] = None

class AudioFileInDBBaseSchema(AudioFileBase):
    id: UUID4
    universe_id: UUID4
    generation_id: Optional[UUID4]
    file_path: str
    file_size: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AudioFileSchema(AudioFileInDBBaseSchema):
    pass

class AudioFileWithDetailsSchema(AudioFileSchema):
    # Add additional fields for detailed view
    midi_events_count: Optional[int] = 0
    scenes_count: Optional[int] = 0
    processing_status: Optional[str] = None
    analysis_data: Optional[Dict] = None
    last_modified: Optional[datetime] = None
    usage_stats: Optional[Dict] = None
    related_files: Optional[List[Dict]] = []

class AudioFileInDBSchema(AudioFileInDBBaseSchema):
    pass
