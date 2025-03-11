"""
Audio file schemas with enhanced validation.
"""

from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, validator
from ..base import BaseAppModel, MetadataModel


class AudioFormat(BaseModel):
    """Audio format specifications."""

    sample_rate: int = Field(
        default=44100, ge=8000, le=192000, description="Sample rate in Hz"
    )
    channels: int = Field(default=2, ge=1, le=8, description="Number of audio channels")
    bit_depth: int = Field(default=16, ge=8, le=32, description="Bit depth")
    encoding: str = Field(default="PCM", description="Audio encoding format")

    @validator("encoding")
    def validate_encoding(cls, v: str) -> str:
        """Validate audio encoding format."""
        allowed_encodings = ["PCM", "FLOAT", "ALAW", "ULAW", "MP3", "AAC"]
        if v.upper() not in allowed_encodings:
            raise ValueError(f"Encoding must be one of: {allowed_encodings}")
        return v.upper()


class AudioFileBase(BaseModel):
    """Base audio file model."""

    filename: str = Field(
        ..., min_length=1, max_length=255, description="Original filename"
    )
    file_path: str = Field(
        ..., min_length=1, max_length=1000, description="Path to stored file"
    )
    file_type: str = Field(default="wav", description="Audio file type")
    duration: float = Field(..., gt=0, description="Duration in seconds")
    format: AudioFormat = Field(
        default_factory=AudioFormat, description="Audio format specifications"
    )
    project_id: Optional[int] = Field(None, gt=0, description="Associated project ID")
    metadata: Dict = Field(default_factory=dict, description="Additional metadata")

    @validator("file_type")
    def validate_file_type(cls, v: str) -> str:
        """Validate audio file type."""
        allowed_types = ["wav", "mp3", "ogg", "flac", "m4a", "aac"]
        if v.lower() not in allowed_types:
            raise ValueError(f"File type must be one of: {allowed_types}")
        return v.lower()

    @validator("duration")
    def validate_duration(cls, v: float) -> float:
        """Validate audio duration."""
        if v <= 0:
            raise ValueError("Duration must be positive")
        if v > 7200:  # 2 hours
            raise ValueError("Duration cannot exceed 2 hours")
        return v


class AudioFileCreate(AudioFileBase):
    """Properties to receive on audio file creation."""

    pass


class AudioFileUpdate(AudioFileBase):
    """Properties to receive on audio file update."""

    filename: Optional[str] = None
    file_path: Optional[str] = None
    file_type: Optional[str] = None
    duration: Optional[float] = None
    format: Optional[AudioFormat] = None
    project_id: Optional[int] = None
    metadata: Optional[Dict] = None


class AudioFile(AudioFileBase, BaseAppModel):
    """Complete audio file model with all properties."""

    user_id: int = Field(..., gt=0)

    class Config:
        """Pydantic configuration."""

        from_attributes = True
        schema_extra = {
            "example": {
                "id": 1,
                "filename": "example.wav",
                "file_path": "/storage/audio/example.wav",
                "file_type": "wav",
                "duration": 180.5,
                "format": {
                    "sample_rate": 44100,
                    "channels": 2,
                    "bit_depth": 16,
                    "encoding": "PCM",
                },
                "project_id": 1,
                "user_id": 1,
                "metadata": {},
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z",
            }
        }
