"""
Visualization schemas with enhanced validation.
"""

from datetime import datetime
from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field, validator
from ..base import BaseAppModel, NameDescriptionModel, MetadataModel

class WebGLSettings(BaseModel):
    """WebGL rendering settings."""
    antialias: bool = Field(default=True, description="Enable antialiasing")
    pixelRatio: float = Field(
        default=1.0,
        ge=0.5,
        le=2.0,
        description="Device pixel ratio"
    )
    shadowMap: bool = Field(default=True, description="Enable shadow mapping")
    maxLights: int = Field(
        default=4,
        ge=1,
        le=8,
        description="Maximum number of lights"
    )
    postProcessing: Dict[str, bool] = Field(
        default_factory=lambda: {
            "bloom": True,
            "ssao": False,
            "fxaa": True
        },
        description="Post-processing effects"
    )

class AudioAnalysisSettings(BaseModel):
    """Audio analysis configuration."""
    fftSize: int = Field(
        default=2048,
        ge=32,
        le=32768,
        description="FFT size for analysis"
    )
    smoothingTimeConstant: float = Field(
        default=0.8,
        ge=0,
        le=1,
        description="Smoothing time constant"
    )
    minDecibels: float = Field(
        default=-100,
        ge=-150,
        le=-50,
        description="Minimum decibels"
    )
    maxDecibels: float = Field(
        default=-30,
        ge=-80,
        le=0,
        description="Maximum decibels"
    )
    frequencyBands: List[Dict[str, Union[float, str]]] = Field(
        default_factory=lambda: [
            {"min": 20, "max": 60, "name": "sub-bass"},
            {"min": 60, "max": 250, "name": "bass"},
            {"min": 250, "max": 500, "name": "low-mid"},
            {"min": 500, "max": 2000, "name": "mid"},
            {"min": 2000, "max": 4000, "name": "upper-mid"},
            {"min": 4000, "max": 6000, "name": "presence"},
            {"min": 6000, "max": 20000, "name": "brilliance"}
        ],
        description="Frequency band definitions"
    )

class AdvancedEffect(BaseModel):
    """Advanced effect configuration."""
    type: str = Field(..., description="Effect type")
    enabled: bool = Field(default=True, description="Effect enabled state")
    parameters: Dict[str, Union[float, str, bool]] = Field(
        default_factory=dict,
        description="Effect parameters"
    )
    uniforms: Dict[str, Union[float, List[float]]] = Field(
        default_factory=dict,
        description="GLSL uniforms"
    )
    blendMode: str = Field(
        default="normal",
        description="Effect blend mode"
    )

    @validator('type')
    def validate_effect_type(cls, v: str) -> str:
        """Validate effect type."""
        allowed_types = [
            "blur", "bloom", "noise", "distortion", "glitch",
            "pixelation", "dotScreen", "rgbShift", "kaleidoscope",
            "fractal", "waveform", "frequency", "particleSystem"
        ]
        if v not in allowed_types:
            raise ValueError(f"Effect type must be one of: {allowed_types}")
        return v

    @validator('blendMode')
    def validate_blend_mode(cls, v: str) -> str:
        """Validate blend mode."""
        allowed_modes = [
            "normal", "multiply", "screen", "overlay", "darken",
            "lighten", "colorDodge", "colorBurn", "hardLight",
            "softLight", "difference", "exclusion", "hue",
            "saturation", "color", "luminosity"
        ]
        if v not in allowed_modes:
            raise ValueError(f"Blend mode must be one of: {allowed_modes}")
        return v

class VisualizationPreset(BaseModel):
    """Visualization preset configuration."""
    name: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1, max_length=1000)
    category: str = Field(..., description="Preset category")
    effects: List[AdvancedEffect] = Field(
        default_factory=list,
        description="Preset effects"
    )
    parameters: Dict[str, Any] = Field(
        default_factory=dict,
        description="Preset parameters"
    )

    @validator('category')
    def validate_category(cls, v: str) -> str:
        """Validate preset category."""
        allowed_categories = [
            "audio", "geometric", "particle", "fractal",
            "abstract", "nature", "space", "custom"
        ]
        if v not in allowed_categories:
            raise ValueError(f"Category must be one of: {allowed_categories}")
        return v

class VisualizationSettings(BaseModel):
    """Enhanced visualization settings."""
    type: str = Field(
        default="waveform",
        description="Type of visualization"
    )
    preset: Optional[VisualizationPreset] = Field(
        None,
        description="Active visualization preset"
    )
    webgl: WebGLSettings = Field(
        default_factory=WebGLSettings,
        description="WebGL settings"
    )
    audioAnalysis: AudioAnalysisSettings = Field(
        default_factory=AudioAnalysisSettings,
        description="Audio analysis settings"
    )
    effects: List[AdvancedEffect] = Field(
        default_factory=list,
        description="Active effects"
    )
    dimensions: Dict[str, int] = Field(
        default_factory=lambda: {"width": 1920, "height": 1080},
        description="Visualization dimensions"
    )
    performance: Dict[str, Union[bool, int]] = Field(
        default_factory=lambda: {
            "useWorkers": True,
            "maxWorkers": 4,
            "bufferSize": 8192,
            "lowLatencyMode": False
        },
        description="Performance settings"
    )

    @validator('type')
    def validate_type(cls, v: str) -> str:
        """Validate visualization type."""
        allowed_types = [
            "waveform", "spectrum", "particles", "3d", "custom",
            "circular", "bars", "mesh", "terrain", "oscilloscope"
        ]
        if v not in allowed_types:
            raise ValueError(f"Type must be one of: {allowed_types}")
        return v

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
