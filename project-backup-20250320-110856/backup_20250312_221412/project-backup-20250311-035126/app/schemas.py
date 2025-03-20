from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

# Universe schemas
class UniverseBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False
    physics_params: Optional[Dict[str, Any]] = None

class UniverseCreate(UniverseBase):
    pass

class UniverseResponse(UniverseBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
