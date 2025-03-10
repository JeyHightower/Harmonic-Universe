"""
Universe schemas with enhanced validation.
"""

from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, validator
from ..base import BaseAppModel, NameDescriptionModel, MetadataModel

class PhysicsParams(BaseModel):
    """Physics parameters for a universe."""
    gravity: float = Field(
        default=9.81,
        ge=0,
        le=100,
        description="Gravitational acceleration in m/s²"
    )
    air_resistance: float = Field(
        default=0.0,
        ge=0,
        le=1,
        description="Air resistance coefficient"
    )
    elasticity: float = Field(
        default=1.0,
        ge=0,
        le=1,
        description="Elasticity coefficient for collisions"
    )
    friction: float = Field(
        default=0.1,
        ge=0,
        le=1,
        description="Friction coefficient"
    )

    @validator('gravity', 'air_resistance', 'elasticity', 'friction')
    def validate_positive(cls, v: float, field: str) -> float:
        """Ensure values are positive."""
        if v < 0:
            raise ValueError(f"{field} must be positive")
        return v

class HarmonyParams(BaseModel):
    """Harmony parameters for a universe."""
    resonance: float = Field(
        default=1.0,
        ge=0,
        le=10,
        description="Resonance factor"
    )
    dissonance: float = Field(
        default=0.0,
        ge=0,
        le=1,
        description="Dissonance factor"
    )
    harmony_scale: float = Field(
        default=1.0,
        ge=0.1,
        le=10,
        description="Scale factor for harmony calculations"
    )
    balance: float = Field(
        default=0.5,
        ge=0,
        le=1,
        description="Balance between harmony and chaos"
    )

    @validator('resonance', 'dissonance', 'harmony_scale', 'balance')
    def validate_range(cls, v: float, field: str) -> float:
        """Validate parameter ranges."""
        if field == 'resonance' and (v < 0 or v > 10):
            raise ValueError("Resonance must be between 0 and 10")
        elif field in ['dissonance', 'balance'] and (v < 0 or v > 1):
            raise ValueError(f"{field} must be between 0 and 1")
        elif field == 'harmony_scale' and (v < 0.1 or v > 10):
            raise ValueError("Harmony scale must be between 0.1 and 10")
        return v

class StoryPoint(BaseModel):
    """Story point in a universe."""
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1, max_length=1000)
    timestamp: datetime
    parameters: Dict[str, float] = Field(
        default_factory=dict,
        description="Parameters affecting the universe at this story point"
    )

    @validator('parameters')
    def validate_parameters(cls, v: Dict[str, float]) -> Dict[str, float]:
        """Validate parameter values."""
        for key, value in v.items():
            if not isinstance(value, (int, float)):
                raise ValueError(f"Parameter {key} must be a number")
        return v

class UniverseBase(NameDescriptionModel, MetadataModel):
    """Base universe model."""
    is_public: bool = Field(
        default=False,
        description="Whether the universe is publicly accessible"
    )
    theme: str = Field(
        default="fantasy",
        description="The theme of the universe"
    )
    physics_params: PhysicsParams = Field(
        default_factory=PhysicsParams,
        description="Physics parameters for the universe"
    )
    harmony_params: HarmonyParams = Field(
        default_factory=HarmonyParams,
        description="Harmony parameters for the universe"
    )
    story_points: List[StoryPoint] = Field(
        default_factory=list,
        description="Story points in the universe"
    )

class UniverseCreate(UniverseBase):
    """Properties to receive on universe creation."""
    pass

class UniverseUpdate(UniverseBase):
    """Properties to receive on universe update."""
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    theme: Optional[str] = None
    physics_params: Optional[PhysicsParams] = None
    harmony_params: Optional[HarmonyParams] = None

class Universe(UniverseBase, BaseAppModel):
    """Complete universe model with all properties."""
    user_id: int = Field(..., gt=0)

    class Config:
        """Pydantic configuration."""
        from_attributes = True
        schema_extra = {
            "example": {
                "id": 1,
                "name": "Example Universe",
                "description": "A test universe",
                "is_public": False,
                "user_id": 1,
                "physics_params": {
                    "gravity": 9.81,
                    "air_resistance": 0.1,
                    "elasticity": 0.8,
                    "friction": 0.2
                },
                "harmony_params": {
                    "resonance": 1.0,
                    "dissonance": 0.2,
                    "harmony_scale": 1.5,
                    "balance": 0.6
                },
                "story_points": [],
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            }
        }
