"""
Visualization schemas with enhanced validation.
"""

from datetime import datetime
from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field, validator
from ..base import BaseAppModel, NameDescriptionModel, MetadataModel

class ColorScheme(BaseModel):
    """Color scheme configuration."""
    primary: str = Field(
        default="#1976d2",
        pattern="^#[0-9a-fA-F]{6}$",
        description="Primary color in hex format"
    )
    secondary: str = Field(
        default="#9c27b0",
        pattern="^#[0-9a-fA-F]{6}$",
        description="Secondary color in hex format"
    )
    background: str = Field(
        default="#121212",
        pattern="^#[0-9a-fA-F]{6}$",
        description="Background color in hex format"
    )
    accent: str = Field(
        default="#ff4081",
        pattern="^#[0-9a-fA-F]{6}$",
        description="Accent color in hex format"
    )

class VisualizationSettings(BaseModel):
    """Visualization settings configuration."""
    type: str = Field(
        default="waveform",
        description="Type of visualization"
    )
    color_scheme: ColorScheme = Field(
        default_factory=ColorScheme,
        description="Color scheme settings"
    )
    resolution: int = Field(
        default=1080,
        ge=480,
        le=4320,
        description="Visualization resolution"
    )
    frame_rate: int = Field(
        default=60,
        ge=24,
        le=144,
        description="Frame rate in FPS"
    )
    effects: Dict[str, float] = Field(
        default_factory=dict,
        description="Visual effects configuration"
    )
    dimensions: Dict[str, int] = Field(
        default_factory=lambda: {"width": 1920, "height": 1080},
        description="Visualization dimensions"
    )

    @validator('type')
    def validate_type(cls, v: str) -> str:
        """Validate visualization type."""
        allowed_types = ["waveform", "spectrum", "particles", "3d", "custom"]
        if v not in allowed_types:
            raise ValueError(f"Type must be one of: {allowed_types}")
        return v

    @validator('effects')
    def validate_effects(cls, v: Dict[str, float]) -> Dict[str, float]:
        """Validate effects configuration."""
        allowed_effects = ["blur", "glow", "noise", "distortion"]
        for effect in v:
            if effect not in allowed_effects:
                raise ValueError(f"Effect {effect} not supported")
            if not 0 <= v[effect] <= 1:
                raise ValueError(f"Effect {effect} value must be between 0 and 1")
        return v

    @validator('dimensions')
    def validate_dimensions(cls, v: Dict[str, int]) -> Dict[str, int]:
        """Validate visualization dimensions."""
        required_keys = ["width", "height"]
        for key in required_keys:
            if key not in v:
                raise ValueError(f"Missing required dimension: {key}")
            if v[key] < 1:
                raise ValueError(f"{key} must be positive")
            if v[key] > 7680:  # 8K resolution limit
                raise ValueError(f"{key} cannot exceed 7680")
        return v

class VisualizationBase(NameDescriptionModel, MetadataModel):
    """Base visualization model."""
    title: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Visualization title"
    )
    type: str = Field(
        ...,
        description="Visualization type"
    )
    settings: VisualizationSettings = Field(
        default_factory=VisualizationSettings,
        description="Visualization settings"
    )
    project_id: Optional[int] = Field(
        None,
        gt=0,
        description="Associated project ID"
    )
    audio_file_id: Optional[int] = Field(
        None,
        gt=0,
        description="Associated audio file ID"
    )

class VisualizationCreate(VisualizationBase):
    """Properties to receive on visualization creation."""
    pass

class VisualizationUpdate(VisualizationBase):
    """Properties to receive on visualization update."""
    title: Optional[str] = None
    type: Optional[str] = None
    settings: Optional[VisualizationSettings] = None
    project_id: Optional[int] = None
    audio_file_id: Optional[int] = None

class Visualization(VisualizationBase, BaseAppModel):
    """Complete visualization model with all properties."""
    user_id: int = Field(..., gt=0)

    class Config:
        """Pydantic configuration."""
        from_attributes = True
        schema_extra = {
            "example": {
                "id": 1,
                "title": "Example Visualization",
                "type": "waveform",
                "settings": {
                    "type": "waveform",
                    "color_scheme": {
                        "primary": "#1976d2",
                        "secondary": "#9c27b0",
                        "background": "#121212",
                        "accent": "#ff4081"
                    },
                    "resolution": 1080,
                    "frame_rate": 60,
                    "effects": {
                        "blur": 0.2,
                        "glow": 0.5
                    },
                    "dimensions": {
                        "width": 1920,
                        "height": 1080
                    }
                },
                "project_id": 1,
                "audio_file_id": 1,
                "user_id": 1,
                "metadata": {},
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            }
        }
