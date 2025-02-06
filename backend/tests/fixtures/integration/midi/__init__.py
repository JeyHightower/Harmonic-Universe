"""MIDI integration test fixtures."""

import pytest
from typing import Dict, Any
from pathlib import Path
import midiutil
import pretty_midi
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audio.midi_event import MidiEvent
from app.core.config import settings

@pytest.fixture
def test_midi_file(tmp_path: Path) -> Path:
    """Create a test MIDI file."""
    midi_path = tmp_path / "test.mid"

    # Create a simple MIDI file with one track
    midi = midiutil.MIDIFile(1)
    midi.addTempo(0, 0, 120)

    # Add a C major scale
    for i, pitch in enumerate([60, 62, 64, 65, 67, 69, 71, 72]):
        midi.addNote(0, 0, pitch, i, 1, 100)

    with open(midi_path, "wb") as f:
        midi.writeFile(f)

    return midi_path

@pytest.fixture
def test_midi_data() -> Dict[str, Any]:
    """Test data for MIDI processing."""
    return {
        "tempo": 120,
        "time_signature": "4/4",
        "key": "C",
        "mode": "major",
        "notes": [
            {"pitch": 60, "start": 0.0, "duration": 1.0, "velocity": 100},
            {"pitch": 64, "start": 1.0, "duration": 1.0, "velocity": 100},
            {"pitch": 67, "start": 2.0, "duration": 1.0, "velocity": 100}
        ]
    }

@pytest.fixture
async def test_midi_events(db: AsyncSession, test_audio_file: Any) -> list[MidiEvent]:
    """Create test MIDI events."""
    events = []
    for i, note in enumerate([60, 64, 67]):  # C major triad
        event = MidiEvent(
            audio_file_id=test_audio_file.id,
            event_type="note_on",
            note=note,
            velocity=100,
            timestamp=float(i),
            duration=1.0,
            channel=0
        )
        db.add(event)
        events.append(event)

    await db.commit()
    for event in events:
        await db.refresh(event)

    return events

@pytest.fixture
def test_midi_sequence() -> pretty_midi.PrettyMIDI:
    """Create a test MIDI sequence."""
    midi_data = pretty_midi.PrettyMIDI(initial_tempo=120)
    piano_program = pretty_midi.instrument_name_to_program('Acoustic Grand Piano')
    piano = pretty_midi.Instrument(program=piano_program)

    # Add a C major chord
    notes = [
        pretty_midi.Note(velocity=100, pitch=60, start=0, end=1),
        pretty_midi.Note(velocity=100, pitch=64, start=0, end=1),
        pretty_midi.Note(velocity=100, pitch=67, start=0, end=1)
    ]
    piano.notes.extend(notes)
    midi_data.instruments.append(piano)

    return midi_data
