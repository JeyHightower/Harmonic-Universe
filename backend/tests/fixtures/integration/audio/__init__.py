"""Audio integration test fixtures."""

import pytest
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audio.audio_file import AudioFile
from app.models.audio.music_parameter import MusicParameter
from app.models.audio.midi_event import MidiEvent

@pytest.fixture
async def test_audio_file(db: AsyncSession, test_user: Dict[str, Any]) -> AudioFile:
    """Create a test audio file."""
    audio = AudioFile(
        name="Test Audio",
        description="Test audio file",
        file_path="/test/path/audio.wav",
        duration=240,
        format="wav",
        sample_rate=48000,
        channels=2,
        file_size=1024 * 1024,  # 1MB
        user_id=test_user["user"].id,
        universe_id=test_user["universe_id"]
    )
    db.add(audio)
    await db.commit()
    await db.refresh(audio)
    return audio

@pytest.fixture
async def test_music_parameter(db: AsyncSession, test_audio_file: AudioFile) -> MusicParameter:
    """Create test music parameters."""
    params = MusicParameter(
        audio_file_id=test_audio_file.id,
        tempo=120,
        key="C",
        mode="major",
        time_signature="4/4",
        energy=0.8,
        danceability=0.7
    )
    db.add(params)
    await db.commit()
    await db.refresh(params)
    return params

@pytest.fixture
async def test_midi_event(db: AsyncSession, test_audio_file: AudioFile) -> MidiEvent:
    """Create test MIDI event."""
    event = MidiEvent(
        audio_file_id=test_audio_file.id,
        event_type="note_on",
        note=60,  # Middle C
        velocity=100,
        timestamp=0.0,
        duration=1.0,
        channel=1
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event
