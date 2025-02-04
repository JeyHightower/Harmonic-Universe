"""
Universe schemas.
"""

from typing import Dict, List, Optional, Any, TYPE_CHECKING
from datetime import datetime
from pydantic import UUID4, BaseModel, Field
from app.schemas.base import UniverseBase, UserBase

if TYPE_CHECKING:
    from app.schemas.scene import Scene

class UniverseCreate(UniverseBase):
    """Create universe schema."""
    name: str
    description: Optional[str] = None
    physics_json: Dict[str, Any] = {}
    music_parameters: Dict[str, Any] = {}

class UniverseUpdate(UniverseBase):
    """Update universe schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    physics_json: Optional[Dict[str, Any]] = None
    music_parameters: Optional[Dict[str, Any]] = None

class Universe(UniverseBase):
    """Universe schema."""
    id: UUID4
    creator_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# For internal use
UniverseInDB = Universe

class UniverseResponse(Universe):
    """Universe response schema."""
    pass

class UniverseWithParameters(UniverseResponse):
    """Universe with parameters schema."""
    physics_parameters: List[Dict[str, Any]] = []
    music_parameters: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True
