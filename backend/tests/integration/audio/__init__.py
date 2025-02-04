"""Audio test suite."""

import pytest
from pathlib import Path
from typing import Dict

from app.models import AudioFile, MidiEvent, MusicParameter

# Register conftest.py for fixture sharing
pytest_plugins = ["tests.conftest"]

@pytest.fixture
def audio_test_data() -> Dict[str, str]:
    """Test data for audio endpoints."""
    return {
        "name": "Test Audio",
        "description": "A test audio file",
        "format": "MP3",
        "type": "MUSIC"
    }

@pytest.fixture
def test_audio_file(tmp_path: Path) -> Path:
    """Create a test audio file."""
    audio_file = tmp_path / "test.mp3"
    audio_file.write_bytes(b"test audio content")
    return audio_file
