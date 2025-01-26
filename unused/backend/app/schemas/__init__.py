"""Schema package initialization."""
from .user import UserSchema
from .universe import (
    UniverseSchema,
    PhysicsParamsSchema,
    MusicParamsSchema,
    VisualParamsSchema,
)
from .storyboard import StoryboardSchema

# Initialize schemas
user_schema = UserSchema()
users_schema = UserSchema(many=True)

universe_schema = UniverseSchema()
universes_schema = UniverseSchema(many=True)

physics_params_schema = PhysicsParamsSchema()
music_params_schema = MusicParamsSchema()
visual_params_schema = VisualParamsSchema()

storyboard_schema = StoryboardSchema()
storyboards_schema = StoryboardSchema(many=True)

__all__ = [
    'UserSchema',
    'UniverseSchema',
    'PhysicsParamsSchema',
    'MusicParamsSchema',
    'VisualParamsSchema',
    'StoryboardSchema',
    'user_schema',
    'users_schema',
    'universe_schema',
    'universes_schema',
    'physics_params_schema',
    'music_params_schema',
    'visual_params_schema',
    'storyboard_schema',
    'storyboards_schema',
]
