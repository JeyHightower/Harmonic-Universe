"""Music generation service."""
import numpy as np
from typing import Dict, Any, List
from ..models import MusicParameters

class Note:
    def __init__(self, pitch: int, start_time: float, duration: float, velocity: float):
        self.pitch = pitch
        self.start_time = start_time
        self.duration = duration
        self.velocity = velocity

    def to_dict(self) -> Dict[str, Any]:
        return {
            'pitch': self.pitch,
            'startTime': self.start_time,
            'duration': self.duration,
            'velocity': self.velocity
        }

class MusicGenerator:
    # MIDI note numbers for different scales
    SCALES = {
        'major': [0, 2, 4, 5, 7, 9, 11],
        'minor': [0, 2, 3, 5, 7, 8, 10],
        'harmonic_minor': [0, 2, 3, 5, 7, 8, 11],
        'melodic_minor': [0, 2, 3, 5, 7, 9, 11],
        'pentatonic': [0, 2, 4, 7, 9],
        'blues': [0, 3, 5, 6, 7, 10]
    }

    # MIDI note numbers for different keys (C = 60)
    KEYS = {
        'C': 60, 'C#': 61, 'D': 62, 'D#': 63,
        'E': 64, 'F': 65, 'F#': 66, 'G': 67,
        'G#': 68, 'A': 69, 'A#': 70, 'B': 71
    }

    def __init__(self):
        """Initialize music generator."""
        self.rng = np.random.default_rng()

    def _get_scale_notes(self, key: str, scale: str) -> List[int]:
        """Get all notes in the given key and scale."""
        base_note = self.KEYS[key]
        scale_intervals = self.SCALES[scale.lower().replace(' ', '_')]
        notes = []

        # Generate notes for 3 octaves
        for octave in [-1, 0, 1]:
            for interval in scale_intervals:
                notes.append(base_note + interval + (12 * octave))

        return sorted(notes)

    def _generate_melody(self, params: MusicParameters, duration: float,
                        available_notes: List[int]) -> List[Note]:
        """Generate melody based on parameters."""
        notes = []
        current_time = 0.0

        # Base note duration on tempo
        base_duration = 60.0 / params.tempo  # Duration of a quarter note

        while current_time < duration:
            # Determine note duration based on harmony
            # Higher harmony = more complex rhythms
            possible_durations = [
                base_duration * x for x in [0.25, 0.5, 1.0, 1.5, 2.0]
            ]
            duration_weights = self._get_duration_weights(params.harmony)
            note_duration = self.rng.choice(possible_durations, p=duration_weights)

            # Select pitch based on harmony
            # Higher harmony = more varied note choices
            pitch = self._select_pitch(available_notes, params.harmony)

            # Determine velocity (volume) based on harmony
            # Higher harmony = more dynamic range
            velocity = self._get_velocity(params.harmony)

            notes.append(Note(pitch, current_time, note_duration, velocity))
            current_time += note_duration

        return notes

    def _get_duration_weights(self, harmony: float) -> List[float]:
        """Get weights for different note durations based on harmony."""
        if harmony < 0.3:
            # Simple rhythms - prefer longer notes
            return [0.1, 0.2, 0.4, 0.2, 0.1]
        elif harmony < 0.7:
            # Balanced rhythms
            return [0.2, 0.3, 0.3, 0.1, 0.1]
        else:
            # Complex rhythms - more short notes
            return [0.3, 0.3, 0.2, 0.1, 0.1]

    def _select_pitch(self, available_notes: List[int], harmony: float) -> int:
        """Select pitch from available notes based on harmony."""
        if harmony < 0.3:
            # Simple melodies - prefer middle register
            weights = self._generate_normal_weights(len(available_notes))
        elif harmony < 0.7:
            # More varied melodies
            weights = self._generate_uniform_weights(len(available_notes))
        else:
            # Complex melodies - use all registers
            weights = self._generate_uniform_weights(len(available_notes))

        return self.rng.choice(available_notes, p=weights)

    def _generate_normal_weights(self, size: int) -> List[float]:
        """Generate weights with normal distribution."""
        x = np.arange(size)
        weights = np.exp(-0.5 * ((x - size/2) / (size/6)) ** 2)
        return weights / weights.sum()

    def _generate_uniform_weights(self, size: int) -> List[float]:
        """Generate uniform weights."""
        return [1.0/size] * size

    def _get_velocity(self, harmony: float) -> float:
        """Get note velocity based on harmony."""
        if harmony < 0.3:
            # Consistent velocity
            return 0.7
        elif harmony < 0.7:
            # Moderate variation
            return self.rng.uniform(0.5, 0.9)
        else:
            # High variation
            return self.rng.uniform(0.3, 1.0)

    def generate(self, params: MusicParameters, duration: float = 30.0,
                start_time: float = 0.0) -> Dict[str, Any]:
        """Generate music based on parameters."""
        # Get available notes for the key and scale
        available_notes = self._get_scale_notes(params.key, params.scale)

        # Generate melody
        melody_notes = self._generate_melody(params, duration, available_notes)

        # Generate accompaniment if harmony is high enough
        accompaniment_notes = []
        if params.harmony > 0.3:
            # Simple accompaniment
            chord_notes = self._generate_accompaniment(params, duration, available_notes)
            accompaniment_notes.extend(chord_notes)

        # Combine all notes and sort by start time
        all_notes = melody_notes + accompaniment_notes
        all_notes.sort(key=lambda x: x.start_time)

        return {
            'notes': [note.to_dict() for note in all_notes],
            'duration': duration,
            'start_time': start_time,
            'parameters': {
                'tempo': params.tempo,
                'key': params.key,
                'scale': params.scale,
                'harmony': params.harmony
            }
        }

    def _generate_accompaniment(self, params: MusicParameters, duration: float,
                              available_notes: List[int]) -> List[Note]:
        """Generate accompaniment based on parameters."""
        notes = []
        current_time = 0.0

        # Base chord duration on tempo
        chord_duration = 240.0 / params.tempo  # Duration of a whole note

        while current_time < duration:
            # Generate chord
            chord_notes = self._get_chord_notes(available_notes, params.harmony)

            # Add chord notes
            velocity = self._get_velocity(params.harmony) * 0.7  # Slightly quieter than melody
            for pitch in chord_notes:
                notes.append(Note(pitch, current_time, chord_duration, velocity))

            current_time += chord_duration

        return notes

    def _get_chord_notes(self, available_notes: List[int], harmony: float) -> List[int]:
        """Get notes for a chord based on harmony level."""
        # Select base note
        base_idx = self.rng.integers(len(available_notes) // 3)  # Use lower register
        base_note = available_notes[base_idx]

        # Build chord
        if harmony < 0.5:
            # Simple triads
            intervals = [0, 4, 7]  # Root, third, fifth
        else:
            # More complex chords
            intervals = [0, 4, 7, 10]  # Seventh chord

        return [base_note + interval for interval in intervals]
