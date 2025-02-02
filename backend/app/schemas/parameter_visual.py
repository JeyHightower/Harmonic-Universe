"""
Parameter visualization schemas.
"""

from typing import Dict, Optional, List
from datetime import datetime
from pydantic import BaseModel, UUID4
import enum

class VisualType(str, enum.Enum):
    """Parameter visualization type enum."""
    GRAPH = "graph"
    GAUGE = "gauge"
    METER = "meter"
    CHART = "chart"
    PLOT = "plot"
    HEATMAP = "heatmap"
    SPECTRUM = "spectrum"
    CUSTOM = "custom"

class ParameterVisualBase(BaseModel):
    """Base parameter visualization schema."""
    type: VisualType
    name: str
    parameters: List[UUID4]  # List of parameter IDs to visualize
    settings: Dict = {}  # Visualization settings (colors, ranges, etc.)
    layout: Dict = {}  # Layout settings (position, size, etc.)
    metadata: Dict = {}

class ParameterVisualCreate(ParameterVisualBase):
    """Parameter visualization creation schema."""
    scene_id: UUID4

class ParameterVisual(ParameterVisualBase):
    """Parameter visualization schema."""
    id: UUID4
    scene_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ParameterVisualUpdate(BaseModel):
    """Parameter visualization update schema."""
    name: Optional[str] = None
    parameters: Optional[List[UUID4]] = None
    settings: Optional[Dict] = None
    layout: Optional[Dict] = None
    metadata: Optional[Dict] = None
