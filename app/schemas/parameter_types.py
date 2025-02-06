"""Parameter type definitions."""

import enum

class ParameterType(str, enum.Enum):
    """Parameter type enum for keyframes."""
    TRANSFORM = "transform"
    MATERIAL = "material"
    CAMERA = "camera"
    LIGHT = "light"
    PHYSICS = "physics"
    AUDIO = "audio"
    CUSTOM = "custom"
