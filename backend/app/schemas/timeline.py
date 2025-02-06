"""Timeline schemas."""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID

from app.schemas.base import BaseSchema

class TimelineBase(BaseSchema):
    """Base timeline schema."""
    name: str = Field(..., description="Timeline name")
    description: Optional[str] = Field(None, description="Timeline description")
    duration: float = Field(..., description="Timeline duration in seconds")
    scene_id: UUID = Field(..., description="ID of the scene this timeline belongs to")
    settings: Dict[str, Any] = Field(default_factory=dict, description="Timeline settings")

class TimelineCreate(TimelineBase):
    """Create timeline schema."""
    pass

class TimelineUpdate(TimelineBase):
    """Update timeline schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[float] = None
    scene_id: Optional[UUID] = None
    settings: Optional[Dict[str, Any]] = None

class TimelineInDBBase(TimelineBase):
    """Base timeline in DB schema."""
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""
        orm_mode = True

class Timeline(TimelineInDBBase):
    """Timeline schema."""
    pass

class TimelineInDB(TimelineInDBBase):
    """Timeline in DB schema."""
    pass
