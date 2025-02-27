"""Audio format enums."""
from enum import Enum

class AudioFormat(str, Enum):
    """Audio format enum."""
    WAV = "wav"
    MP3 = "mp3"
    OGG = "ogg"
    FLAC = "flac"
    MIDI = "midi"

class AudioType(str, Enum):
    """Audio type enum."""
    MUSIC = "music"
    SOUND_EFFECT = "sound_effect"
    VOICE = "voice"
    AMBIENT = "ambient"
    GENERATED = "generated"
