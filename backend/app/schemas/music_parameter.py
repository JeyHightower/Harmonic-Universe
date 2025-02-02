"""
Music parameter schemas.
"""

from typing import Dict, Optional, Union, List
from datetime import datetime
from pydantic import BaseModel, UUID4, Field
import enum

class MusicParameterType(str, enum.Enum):
    """Music parameter type enum."""
    TEMPO = "tempo"
    PITCH = "pitch"
    VOLUME = "volume"
    FREQUENCY = "frequency"
    RHYTHM = "rhythm"
    HARMONY = "harmony"
    TIMBRE = "timbre"
    CUSTOM = "custom"

class MusicParameterBase(BaseModel):
    """Base music parameter schema."""
    name: str
    type: MusicParameterType
    value: Union[float, Dict, List] = Field(description="Parameter value - can be a number, vector, or complex data")
    units: Optional[str] = None
    range: Optional[Dict[str, float]] = Field(
        default=None,
        description="Optional min/max range for parameter validation"
    )
    settings: Dict = {}  # Additional parameter settings
    metadata: Dict = {}  # Metadata for visualization and other purposes

class MusicParameterCreate(MusicParameterBase):
    """Music parameter creation schema."""
    scene_id: UUID4

class MusicParameter(MusicParameterBase):
    """Music parameter schema."""
    id: UUID4
    scene_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MusicParameterUpdate(BaseModel):
    """Music parameter update schema."""
    name: Optional[str] = None
    value: Optional[Union[float, Dict, List]] = None
    units: Optional[str] = None
    range: Optional[Dict[str, float]] = None
    settings: Optional[Dict] = None
    metadata: Optional[Dict] = None

class MusicParameterGroup(BaseModel):
    """Group of related music parameters."""
    id: UUID4
    name: str
    parameters: List[MusicParameter]
    metadata: Dict = {}
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
