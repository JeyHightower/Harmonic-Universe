"""
Base schemas.
"""

from typing import Optional, Dict, List
from pydantic import BaseModel, EmailStr, UUID4
from datetime import datetime

class BaseSchema(BaseModel):
    """Base schema with common fields."""
    id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    full_name: str
    is_active: bool = True
    is_superuser: bool = False

class UniverseBase(BaseModel):
    """Base universe schema."""
    name: str
    description: Optional[str] = None
    physics_parameters: List = []
    music_parameters: List = []

class SceneBase(BaseModel):
    """Base scene schema."""
    name: str
    description: Optional[str] = None
    physics_parameters: Dict = {}
    music_parameters: Dict = {}
