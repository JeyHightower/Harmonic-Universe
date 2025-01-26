"""Core services initialization."""
try:
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False

try:
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False


class AudioProcessor:
    """Stub for audio processor."""


class VisualizationProcessor:
    """Stub for visualization processor."""


__all__ = [
    "AudioProcessor",
    "VisualizationProcessor",
    "LIBROSA_AVAILABLE",
    "PYDUB_AVAILABLE",
]
