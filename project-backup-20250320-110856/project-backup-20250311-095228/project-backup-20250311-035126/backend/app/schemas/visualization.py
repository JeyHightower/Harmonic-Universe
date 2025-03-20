from pydantic import BaseModel
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime

class VisualizationBase(BaseModel):
    name: str
    type: str
    parameters: Optional[Dict[str, Any]] = None
    universe_id: UUID

class VisualizationCreate(VisualizationBase):
    pass

class VisualizationUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None

class VisualizationResponse(VisualizationBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
