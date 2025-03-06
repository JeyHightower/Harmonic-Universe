from pydantic import BaseModel
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime

class AiModelBase(BaseModel):
    name: str
    type: str
    parameters: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = True

class AiModelCreate(AiModelBase):
    pass

class AiModelUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class AiModelResponse(AiModelBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
