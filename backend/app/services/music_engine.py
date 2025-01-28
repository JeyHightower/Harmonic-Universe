import numpy as np
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import threading
import time

@dataclass
class Note:
    frequency: float
    amplitude: float
    duration: float
    start_time: float
    waveform: str = 'sine'

class MusicEngine:
    """Core music engine for universe harmonics."""

    def __init__(self, universe_id: int, parameters: Dict):
        self.universe_id = universe_id
        self.parameters = parameters
        self.sample_rate = parameters.get('sample_rate', 44100)
        self.bpm = parameters.get('bpm', 120)
        self.key = parameters.get('key', 'C')
        self.scale = parameters.get('scale', 'major')
        self.notes: List[Note] = []
        self.is_playing = False
        self._playback_thread = None

        # Define musical scales
        self.scales = {
            'major': [0, 2, 4, 5, 7, 9, 11],
            'minor': [0, 2, 3, 5, 7, 8, 10],
            'pentatonic': [0, 2, 4, 7, 9],
            'chromatic': list(range(12))
        }

    def note_to_frequency(self, note: int, octave: int = 4) -> float:
        """Convert MIDI note number to frequency."""
        return 440 * (2 ** ((note - 69) / 12))

    def generate_waveform(self, frequency: float, duration: float,
                         amplitude: float, waveform: str) -> np.ndarray:
        """Generate audio waveform."""
        t = np.linspace(0, duration, int(self.sample_rate * duration), False)

        if waveform == 'sine':
            samples = amplitude * np.sin(2 * np.pi * frequency * t)
        elif waveform == 'square':
            samples = amplitude * np.sign(np.sin(2 * np.pi * frequency * t))
        elif waveform == 'sawtooth':
            samples = amplitude * 2 * (frequency * t - np.floor(0.5 + frequency * t))
        elif waveform == 'triangle':
            samples = amplitude * 2 * abs(2 * (frequency * t - np.floor(0.5 + frequency * t))) - 1
        else:
            samples = np.zeros_like(t)

        # Apply envelope
        attack = int(0.1 * len(samples))
        decay = int(0.1 * len(samples))
        samples[:attack] *= np.linspace(0, 1, attack)
        samples[-decay:] *= np.linspace(1, 0, decay)

        return samples

    def add_note(self, note: Note):
        """Add a note to the sequence."""
        self.notes.append(note)
        self.notes.sort(key=lambda x: x.start_time)

    def remove_note(self, start_time: float, frequency: float):
        """Remove a note from the sequence."""
        self.notes = [n for n in self.notes
                     if not (n.start_time == start_time and n.frequency == frequency)]

    def get_current_chord(self, time: float) -> List[Note]:
        """Get all notes playing at a given time."""
        return [note for note in self.notes
                if note.start_time <= time < note.start_time + note.duration]

    def generate_harmony(self, base_note: int, chord_type: str = 'major') -> List[int]:
        """Generate harmony notes for a given base note."""
        chord_types = {
            'major': [0, 4, 7],
            'minor': [0, 3, 7],
            'diminished': [0, 3, 6],
            'augmented': [0, 4, 8],
            'seventh': [0, 4, 7, 10]
        }

        return [base_note + interval for interval in chord_types.get(chord_type, [])]

    def _playback_loop(self):
        """Internal playback loop."""
        start_time = time.time()
        buffer_size = 1024

        while self.is_playing:
            current_time = time.time() - start_time
            current_notes = self.get_current_chord(current_time)

            if not current_notes:
                time.sleep(0.01)
                continue

            # Mix all current notes
            mixed_audio = np.zeros(buffer_size)
            for note in current_notes:
                samples = self.generate_waveform(
                    note.frequency,
                    buffer_size / self.sample_rate,
                    note.amplitude,
                    note.waveform
                )
                mixed_audio += samples

            # Normalize
            if np.max(np.abs(mixed_audio)) > 1:
                mixed_audio /= np.max(np.abs(mixed_audio))

            # Here you would send mixed_audio to audio output
            # This is a placeholder for actual audio output implementation
            time.sleep(buffer_size / self.sample_rate)

    def start_playback(self):
        """Start music playback."""
        if not self.is_playing:
            self.is_playing = True
            self._playback_thread = threading.Thread(target=self._playback_loop)
            self._playback_thread.start()

    def stop_playback(self):
        """Stop music playback."""
        self.is_playing = False
        if self._playback_thread:
            self._playback_thread.join()

    def get_state(self) -> Dict:
        """Get current state of the music engine."""
        return {
            'bpm': self.bpm,
            'key': self.key,
            'scale': self.scale,
            'notes': [
                {
                    'frequency': note.frequency,
                    'amplitude': note.amplitude,
                    'duration': note.duration,
                    'start_time': note.start_time,
                    'waveform': note.waveform
                }
                for note in self.notes
            ],
            'is_playing': self.is_playing
        }

    def set_parameters(self, parameters: Dict):
        """Update music parameters."""
        self.bpm = parameters.get('bpm', self.bpm)
        self.key = parameters.get('key', self.key)
        self.scale = parameters.get('scale', self.scale)
        self.sample_rate = parameters.get('sample_rate', self.sample_rate)
