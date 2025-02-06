"""Audio model tests."""

import pytest
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audio.audio_file import AudioFile
from app.models.audio.music_parameter import MusicParameter
from app.models.audio.midi_event import MidiEvent

@pytest.mark.asyncio
async def test_create_audio_file(db: AsyncSession, test_user: Dict[str, Any]):
    """Test creating an audio file."""
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

    assert audio.id is not None
    assert audio.name == "Test Audio"
    assert audio.format == "wav"
    assert audio.duration == 240
    assert audio.user_id == test_user["user"].id

@pytest.mark.asyncio
async def test_create_music_parameter(db: AsyncSession, test_audio_file: AudioFile):
    """Test creating music parameters."""
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

    assert params.id is not None
    assert params.audio_file_id == test_audio_file.id
    assert params.tempo == 120
    assert params.key == "C"
    assert params.mode == "major"
    assert params.energy == 0.8

@pytest.mark.asyncio
async def test_create_midi_event(db: AsyncSession, test_audio_file: AudioFile):
    """Test creating MIDI events."""
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

    assert event.id is not None
    assert event.audio_file_id == test_audio_file.id
    assert event.event_type == "note_on"
    assert event.note == 60
    assert event.velocity == 100

@pytest.mark.asyncio
async def test_audio_file_relationships(
    db: AsyncSession,
    test_audio_file: AudioFile,
    test_music_parameter: MusicParameter,
    test_midi_event: MidiEvent
):
    """Test relationships between audio models."""
    # Refresh audio file to load relationships
    await db.refresh(test_audio_file)

    # Test music parameters relationship
    assert test_audio_file.music_parameters is not None
    assert len(test_audio_file.music_parameters) > 0
    assert test_audio_file.music_parameters[0].id == test_music_parameter.id

    # Test MIDI events relationship
    assert test_audio_file.midi_events is not None
    assert len(test_audio_file.midi_events) > 0
    assert test_audio_file.midi_events[0].id == test_midi_event.id

@pytest.mark.asyncio
async def test_update_audio_file(db: AsyncSession, test_audio_file: AudioFile):
    """Test updating an audio file."""
    # Update audio file attributes
    test_audio_file.name = "Updated Audio"
    test_audio_file.description = "Updated description"
    await db.commit()
    await db.refresh(test_audio_file)

    assert test_audio_file.name == "Updated Audio"
    assert test_audio_file.description == "Updated description"

@pytest.mark.asyncio
async def test_delete_audio_file(db: AsyncSession, test_audio_file: AudioFile):
    """Test deleting an audio file."""
    # Delete audio file
    await db.delete(test_audio_file)
    await db.commit()

    # Try to fetch deleted audio file
    result = await db.get(AudioFile, test_audio_file.id)
    assert result is None
