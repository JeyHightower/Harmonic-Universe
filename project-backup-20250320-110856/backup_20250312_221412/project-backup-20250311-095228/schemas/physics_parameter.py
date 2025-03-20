from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class PhysicsParameterBase(BaseModel):
    name: str
    value: float
    unit: Optional[str] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    universe_id: UUID

class PhysicsParameterCreate(PhysicsParameterBase):
    pass

class PhysicsParameterUpdate(BaseModel):
    name: Optional[str] = None
    value: Optional[float] = None
    unit: Optional[str] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None

class PhysicsParameterResponse(PhysicsParameterBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
