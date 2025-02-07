from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime

class PhysicsParams(BaseModel):
    gravity: float = Field(default=9.81)
    air_resistance: float = Field(default=0.0)
    elasticity: float = Field(default=1.0)
    friction: float = Field(default=0.1)

class HarmonyParams(BaseModel):
    resonance: float = Field(default=1.0)
    dissonance: float = Field(default=0.0)
    harmony_scale: float = Field(default=1.0)
    balance: float = Field(default=0.5)

class StoryPoint(BaseModel):
    title: str
    description: str
    timestamp: datetime
    parameters: Dict[str, float]

class UniverseBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False
    physics_params: PhysicsParams
    harmony_params: HarmonyParams
    story_points: List[StoryPoint] = []

class UniverseCreate(UniverseBase):
    pass

class UniverseUpdate(UniverseBase):
    pass

class Universe(UniverseBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
