from .auth import auth_bp
from .characters import characters_bp
from .notes import notes_bp
from .universes import universes_bp
from .scenes import scenes_bp
from .physics import physics_bp
from .music import music_bp

__all__ = [
    'auth_bp', 'characters_bp', 'notes_bp', 'universes_bp',
    'scenes_bp', 'physics_bp', 'music_bp'
] 