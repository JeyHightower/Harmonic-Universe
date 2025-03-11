from typing import Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class UniverseBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False
    physics_params: Optional[Dict[str, Any]] = None
    harmony_params: Optional[Dict[str, Any]] = None
    story_points: Optional[Dict[str, Any]] = None
    visualization_params: Optional[Dict[str, Any]] = None

class UniverseCreate(UniverseBase):
    pass

class UniverseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    physics_params: Optional[Dict[str, Any]] = None
    harmony_params: Optional[Dict[str, Any]] = None
    story_points: Optional[Dict[str, Any]] = None
    visualization_params: Optional[Dict[str, Any]] = None

class UniverseInDBBase(UniverseBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class Universe(UniverseInDBBase):
    pass
