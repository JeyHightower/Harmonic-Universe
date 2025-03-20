from typing import Dict, Any, List, Optional, Tuple
import pretty_midi
import midiutil
import numpy as np
from pathlib import Path

from backend.app.models.midi_event import MIDIEventType, MIDIEvent
from backend.app.schemas.midi_event import MIDIEventCreate


class MIDIProcessor:
    def __init__(self, file_path: Optional[str] = None):
        self.file_path = file_path
        self._midi_data = None
        if file_path:
            self._load_midi()

    @property
    def midi_data(self) -> pretty_midi.PrettyMIDI:
        if self._midi_data is None:
            self._midi_data = pretty_midi.PrettyMIDI()
        return self._midi_data

    def _load_midi(self):
        """Load MIDI file into memory."""
        self._midi_data = pretty_midi.PrettyMIDI(self.file_path)

    def create_midi_file(
        self,
        events: List[Dict[str, Any]],
        tempo: int = 120,
        time_signature: Tuple[int, int] = (4, 4),
    ) -> None:
        """Create a new MIDI file from events."""
        self._midi_data = pretty_midi.PrettyMIDI(initial_tempo=tempo)

        # Create a new instrument program (default to piano)
        instrument = pretty_midi.Instrument(program=0)

        # Process events
        for event in events:
            if event["type"] == "note":
                note = pretty_midi.Note(
                    velocity=event.get("velocity", 100),
                    pitch=event["pitch"],
                    start=event["start_time"],
                    end=event["end_time"],
                )
                instrument.notes.append(note)
            elif event["type"] == "control_change":
                instrument.control_changes.append(
                    pretty_midi.ControlChange(
                        number=event["control"],
                        value=event["value"],
                        time=event["time"],
                    )
                )

        self._midi_data.instruments.append(instrument)

    def extract_events(self) -> List[MIDIEventCreate]:
        """Extract MIDI events from the file."""
        events = []

        for instrument in self.midi_data.instruments:
            # Process notes
            for note in instrument.notes:
                # Note On event
                events.append(
                    MIDIEventCreate(
                        event_type=MIDIEventType.NOTE_ON,
                        timestamp=note.start,
                        channel=instrument.program,
                        note=note.pitch,
                        velocity=note.velocity,
                    )
                )

                # Note Off event
                events.append(
                    MIDIEventCreate(
                        event_type=MIDIEventType.NOTE_OFF,
                        timestamp=note.end,
                        channel=instrument.program,
                        note=note.pitch,
                        velocity=0,
                    )
                )

            # Process control changes
            for cc in instrument.control_changes:
                events.append(
                    MIDIEventCreate(
                        event_type=MIDIEventType.CONTROL_CHANGE,
                        timestamp=cc.time,
                        channel=instrument.program,
                        control=cc.number,
                        value=cc.value,
                    )
                )

        # Sort events by timestamp
        events.sort(key=lambda x: x.timestamp)
        return events

    def get_tempo_changes(self) -> List[Tuple[float, float]]:
        """Get list of tempo changes with their timestamps."""
        return [
            (change.time, change.tempo) for change in self.midi_data.get_tempo_changes()
        ]

    def get_time_signature_changes(self) -> List[Tuple[float, Tuple[int, int]]]:
        """Get list of time signature changes with their timestamps."""
        return self.midi_data.time_signature_changes

    def quantize_events(self, grid_size: float = 0.25) -> None:
        """Quantize note timings to a grid."""
        for instrument in self.midi_data.instruments:
            for note in instrument.notes:
                # Quantize start time
                note.start = round(note.start / grid_size) * grid_size
                # Quantize end time
                note.end = round(note.end / grid_size) * grid_size

    def transpose(self, semitones: int) -> None:
        """Transpose all notes by the specified number of semitones."""
        for instrument in self.midi_data.instruments:
            for note in instrument.notes:
                note.pitch = np.clip(note.pitch + semitones, 0, 127)

    def save(self, output_path: Optional[str] = None) -> str:
        """Save MIDI data to file."""
        if output_path is None:
            if self.file_path is None:
                raise ValueError("No output path specified")
            output_path = self.file_path

        self.midi_data.write(output_path)
        return output_path
