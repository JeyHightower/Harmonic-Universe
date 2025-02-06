"""
Test MIDI processing functionality.
"""

import pytest
import numpy as np
from pathlib import Path
import midiutil
import pretty_midi
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audio.midi_processor import MidiProcessor
from app.models.audio.midi_event import MidiEvent, MidiEventType
from app.schemas.midi_event import MidiEventCreate

@pytest.fixture
def test_midi_file(tmp_path):
    """Create a test MIDI file."""
    file_path = tmp_path / "test.midi"
    midi_data = pretty_midi.PrettyMIDI()

    # Create a piano program
    piano = pretty_midi.Instrument(program=0)

    # Add some notes with non-quantized timings
    notes = [
        (60, 100, 0.123, 0.456),  # C4, non-quantized
        (64, 100, 0.789, 1.234),  # E4, non-quantized
        (67, 100, 1.567, 2.098),  # G4, non-quantized
    ]

    for pitch, velocity, start, end in notes:
        note = pretty_midi.Note(
            velocity=velocity,
            pitch=pitch,
            start=start,
            end=end
        )
        piano.notes.append(note)

    # Add a control change
    cc = pretty_midi.ControlChange(
        number=64,  # Sustain pedal
        value=100,
        time=0.1
    )
    piano.control_changes.append(cc)

    midi_data.instruments.append(piano)
    midi_data.write(str(file_path))

    return file_path

def test_midi_loading(test_midi_file):
    """Test loading MIDI file."""
    processor = MidiProcessor(str(test_midi_file))
    assert processor.midi_data is not None
    assert len(processor.midi_data.instruments) == 1
    assert len(processor.midi_data.instruments[0].notes) == 3

def test_extract_events(test_midi_file):
    """Test extracting MIDI events."""
    processor = MidiProcessor(str(test_midi_file))
    audio_file_id = "12345678-1234-5678-1234-567812345678"  # Test UUID
    events = processor.extract_events(audio_file_id)

    # Should have NOTE_ON, CONTROL_CHANGE, and NOTE_OFF events
    assert len(events) == 3

    # Check event types and order
    assert events[0].event_type == MidiEventType.NOTE_ON
    assert events[1].event_type == MidiEventType.CONTROL_CHANGE
    assert events[2].event_type == MidiEventType.NOTE_OFF

    # Check timestamps are in order
    assert events[0].timestamp < events[1].timestamp < events[2].timestamp

    # Check audio_file_id is set correctly
    for event in events:
        assert str(event.audio_file_id) == audio_file_id

def test_create_midi_file(tmp_path):
    """Test creating MIDI file from events."""
    processor = MidiProcessor()
    output_path = tmp_path / "output.midi"

    # Create some events
    events = [
        {
            "type": "note",
            "pitch": 60,
            "velocity": 100,
            "start_time": 0.0,
            "end_time": 0.5
        },
        {
            "type": "control_change",
            "control": 64,
            "value": 100,
            "time": 0.1
        }
    ]

    # Create MIDI file
    processor.create_midi_file(events, tempo=120)
    processor.save(str(output_path))

    # Verify created file
    assert output_path.exists()

    # Load and check contents
    created_processor = MIDIProcessor(str(output_path))
    assert len(created_processor.midi_data.instruments) == 1
    assert len(created_processor.midi_data.instruments[0].notes) == 3
    assert len(created_processor.midi_data.instruments[0].control_changes) == 1

def test_get_tempo_changes(test_midi_file):
    """Test getting tempo changes."""
    processor = MIDIProcessor(str(test_midi_file))
    tempo_changes = processor.get_tempo_changes()

    assert len(tempo_changes) > 0
    for time, tempo in tempo_changes:
        assert isinstance(time, float)
        assert isinstance(tempo, float)
        assert tempo > 0

def test_get_time_signature_changes(test_midi_file):
    """Test getting time signature changes."""
    processor = MIDIProcessor(str(test_midi_file))
    time_sigs = processor.get_time_signature_changes()

    assert len(time_sigs) > 0
    for time, (numerator, denominator) in time_sigs:
        assert isinstance(time, float)  # time
        assert isinstance(numerator, int)  # numerator
        assert isinstance(denominator, int)  # denominator
        assert numerator > 0
        assert denominator > 0

def test_quantize_events(test_midi_file):
    """Test quantizing note timings."""
    processor = MIDIProcessor(str(test_midi_file))
    original_notes = [
        (note.start, note.end)
        for instrument in processor.midi_data.instruments
        for note in instrument.notes
    ]

    # Quantize to quarter notes
    processor.quantize_events(grid_size=0.25)

    quantized_notes = [
        (note.start, note.end)
        for instrument in processor.midi_data.instruments
        for note in instrument.notes
    ]

    # Check that times have been quantized
    for (orig_start, orig_end), (quant_start, quant_end) in zip(
        original_notes, quantized_notes
    ):
        assert quant_start % 0.25 == pytest.approx(0, abs=1e-6)
        assert quant_end % 0.25 == pytest.approx(0, abs=1e-6)
        assert quant_start != orig_start or quant_end != orig_end

def test_transpose(test_midi_file):
    """Test transposing notes."""
    processor = MIDIProcessor(str(test_midi_file))
    original_pitches = [
        note.pitch
        for instrument in processor.midi_data.instruments
        for note in instrument.notes
    ]

    # Transpose up by 2 semitones
    processor.transpose(2)

    transposed_pitches = [
        note.pitch
        for instrument in processor.midi_data.instruments
        for note in instrument.notes
    ]

    # Check that pitches have been transposed
    for orig_pitch, trans_pitch in zip(original_pitches, transposed_pitches):
        assert trans_pitch == orig_pitch + 2

def test_save_midi(test_midi_file, tmp_path):
    """Test saving MIDI file."""
    processor = MIDIProcessor(str(test_midi_file))
    output_path = tmp_path / "output.midi"

    # Modify and save
    processor.transpose(2)
    saved_path = processor.save(str(output_path))

    assert Path(saved_path).exists()

    # Load saved file and verify changes
    loaded_processor = MIDIProcessor(str(saved_path))
    assert len(loaded_processor.midi_data.instruments) == len(processor.midi_data.instruments)

    for orig_inst, saved_inst in zip(
        processor.midi_data.instruments,
        loaded_processor.midi_data.instruments
    ):
        assert len(orig_inst.notes) == len(saved_inst.notes)
        for orig_note, saved_note in zip(orig_inst.notes, saved_inst.notes):
            assert orig_note.pitch == saved_note.pitch
