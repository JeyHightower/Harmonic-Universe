from marshmallow import Schema, fields, validates, ValidationError
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, Dict, Union, List, Any
from collections import OrderedDict
import re


class PhysicsParamsSchema(Schema):
    """Schema for physics parameters."""
    gravity = fields.Float(required=True)
    friction = fields.Float(required=True)
    elasticity = fields.Float(required=True)
    air_resistance = fields.Float(required=True)

    @validates('gravity')
    def validate_gravity(self, value):
        if value <= 0:
            raise ValidationError('Gravity must be positive')

    @validates('friction')
    def validate_friction(self, value):
        if not 0 <= value <= 1:
            raise ValidationError('Friction must be between 0 and 1')

    @validates('elasticity')
    def validate_elasticity(self, value):
        if not 0 <= value <= 1:
            raise ValidationError('Elasticity must be between 0 and 1')

    @validates('air_resistance')
    def validate_air_resistance(self, value):
        if not 0 <= value <= 1:
            raise ValidationError('Air resistance must be between 0 and 1')


class MusicParamsSchema(Schema):
    """Schema for music parameters."""
    harmony = fields.String(required=True)
    tempo = fields.Float(required=True)
    key = fields.String(required=True)
    scale = fields.String(required=True)

    @validates('tempo')
    def validate_tempo(self, value):
        if not 20 <= value <= 300:
            raise ValidationError('Tempo must be between 20 and 300 BPM')


class VisualParamsSchema(Schema):
    """Schema for visualization parameters."""
    color_scheme = fields.String(required=True)
    particle_size = fields.Float(required=True)
    trail_length = fields.Float(required=True)

    @validates('particle_size')
    def validate_particle_size(self, value):
        if value <= 0:
            raise ValidationError('Particle size must be positive')

    @validates('trail_length')
    def validate_trail_length(self, value):
        if value <= 0:
            raise ValidationError('Trail length must be positive')


class UniverseSchema(Schema):
    """Schema for serializing/deserializing universe data."""
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    description = fields.Str()
    is_public = fields.Bool()
    user_id = fields.Int(required=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    # Parameters
    physics_params = fields.Nested(PhysicsParamsSchema)
    music_params = fields.Nested(MusicParamsSchema)
    visual_params = fields.Nested(VisualParamsSchema)

    # Relationships
    user = fields.Nested("UserSchema", only=("id", "username"), dump_only=True)
    storyboards = fields.Nested("StoryboardSchema", many=True, dump_only=True)

    class Meta:
        """Meta class for UniverseSchema."""
        dict_class = OrderedDict


class MusicParameters(BaseModel):
    """Schema for music parameters validation."""
    tempo: float = Field(60.0, ge=20.0, le=300.0, description="Tempo in BPM")
    scale: str = Field("C major", description="Musical scale")
    volume: float = Field(0.8, ge=0.0, le=1.0, description="Master volume")
    reverb: Optional[float] = Field(0.3, ge=0.0, le=1.0, description="Reverb amount")
    delay: Optional[float] = Field(0.2, ge=0.0, le=1.0, description="Delay amount")
    base_frequency: Optional[float] = Field(440.0, ge=20.0, le=20000.0, description="Base frequency in Hz")

    model_config = ConfigDict(from_attributes=True)

    @field_validator('scale')
    @classmethod
    def validate_scale(cls, v: str) -> str:
        """Validate musical scale format."""
        valid_notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        valid_types = ['major', 'minor', 'harmonic minor', 'melodic minor', 'pentatonic']
        parts = v.split()
        if len(parts) < 2:
            raise ValueError('Scale must include note and type')
        note = parts[0].upper()
        scale_type = ' '.join(parts[1:]).lower()
        if note not in valid_notes:
            raise ValueError(f'Invalid note. Must be one of {valid_notes}')
        if scale_type not in valid_types:
            raise ValueError(f'Invalid scale type. Must be one of {valid_types}')
        return f"{note} {scale_type}"


class VisualParameters(BaseModel):
    """Schema for visual parameters validation."""
    background: str = Field("#000000", description="Background color in hex")
    particle_count: int = Field(1000, ge=0, le=10000, description="Number of particles")
    animation_speed: float = Field(1.0, ge=0.0, le=5.0, description="Animation speed multiplier")
    color_scheme: List[str] = Field(
        ["#FF0000", "#00FF00", "#0000FF"],
        min_length=1,
        max_length=10,
        description="List of colors in hex format"
    )
    particle_size: float = Field(1.0, ge=0.1, le=10.0, description="Base particle size")
    glow_intensity: float = Field(0.5, ge=0.0, le=1.0, description="Particle glow intensity")

    model_config = ConfigDict(from_attributes=True)

    @field_validator('background', 'color_scheme')
    @classmethod
    def validate_color(cls, v: Union[str, List[str]]) -> Union[str, List[str]]:
        """Validate hex color format."""
        if isinstance(v, list):
            for color in v:
                if not re.match(r'^#[0-9A-Fa-f]{6}$', color):
                    raise ValueError(f'Invalid hex color format: {color}')
            return v
        if not re.match(r'^#[0-9A-Fa-f]{6}$', v):
            raise ValueError('Invalid hex color format')
        return v


class UniverseBase(BaseModel):
    """Base schema for Universe."""
    name: str
    description: Optional[str] = None
    is_public: Optional[bool] = True
    max_participants: Optional[int] = 10
    music_parameters: Optional[Dict[str, Any]] = {}
    visual_parameters: Optional[Dict[str, Any]] = {}

    model_config = ConfigDict(from_attributes=True)


class UniverseCreate(UniverseBase):
    """Schema for creating a Universe."""
    pass


class UniverseUpdate(BaseModel):
    """Schema for updating a Universe."""
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    max_participants: Optional[int] = None
    music_parameters: Optional[Dict[str, Any]] = None
    visual_parameters: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class UniverseResponse(UniverseBase):
    """Schema for Universe response."""
    id: int
    user_id: int
    collaborators_count: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
