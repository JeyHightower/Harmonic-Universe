"""
Export schemas.
"""

from typing import Dict, Optional
from datetime import datetime
from pydantic import BaseModel, UUID4

from app.models.export import ExportFormat, ExportStatus

class ExportBase(BaseModel):
    """Base export schema."""
    format: ExportFormat
    settings: Dict = {}

class ExportCreate(ExportBase):
    """Export creation schema."""
    pass

class Export(ExportBase):
    """Export schema."""
    id: UUID4
    scene_id: UUID4
    status: ExportStatus
    output_path: Optional[str] = None
    error_message: Optional[str] = None
    progress: float = 0.0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ExportUpdate(BaseModel):
    """Export update schema."""
    status: Optional[ExportStatus] = None
    output_path: Optional[str] = None
    error_message: Optional[str] = None
    progress: Optional[float] = None
