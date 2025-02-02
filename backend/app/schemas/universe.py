"""
Universe schemas.
"""

from typing import Dict, List, Optional
from datetime import datetime
from pydantic import UUID4
from app.schemas.base import UniverseBase, UserBase

class UniverseCreate(UniverseBase):
    """Universe creation schema."""
    pass

class UniverseUpdate(UniverseBase):
    """Universe update schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    physics_parameters: Optional[Dict] = None
    music_parameters: Optional[Dict] = None

class Universe(UniverseBase):
    """Universe schema."""
    id: UUID4
    creator_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UniverseResponse(Universe):
    """Universe response schema."""
    creator: UserBase
    scenes: List['Scene'] = []

    class Config:
        from_attributes = True

class UniverseWithParameters(UniverseResponse):
    """Universe response schema with detailed parameters."""
    physics_parameters: Dict
    music_parameters: Dict

# Avoid circular imports
from app.schemas.scene import Scene
