from typing import Dict, Any, List, Optional
import numpy as np
import sounddevice as sd
import pretty_midi
from scipy import signal


class Synthesizer:
    def __init__(self, sample_rate: int = 44100):
        self.sample_rate = sample_rate
        self._oscillators = {}
        self._envelopes = {}
        self._filters = {}

    def create_oscillator(
        self,
        name: str,
        waveform: str = "sine",
        frequency: float = 440.0,
        amplitude: float = 0.5,
    ) -> None:
        """Create a new oscillator."""
        self._oscillators[name] = {
            "waveform": waveform,
            "frequency": frequency,
            "amplitude": amplitude,
        }

    def create_envelope(
        self,
        name: str,
        attack: float = 0.1,
        decay: float = 0.1,
        sustain: float = 0.7,
        release: float = 0.2,
    ) -> None:
        """Create an ADSR envelope."""
        self._envelopes[name] = {
            "attack": attack,
            "decay": decay,
            "sustain": sustain,
            "release": release,
        }

    def create_filter(
        self,
        name: str,
        filter_type: str = "lowpass",
        cutoff: float = 1000.0,
        resonance: float = 1.0,
    ) -> None:
        """Create an audio filter."""
        self._filters[name] = {
            "type": filter_type,
            "cutoff": cutoff,
            "resonance": resonance,
        }

    def _generate_waveform(
        self, frequency: float, duration: float, waveform: str = "sine"
    ) -> np.ndarray:
        """Generate a waveform of specified type."""
        t = np.linspace(0, duration, int(self.sample_rate * duration), False)

        if waveform == "sine":
            return np.sin(2 * np.pi * frequency * t)
        elif waveform == "square":
            return signal.square(2 * np.pi * frequency * t)
        elif waveform == "sawtooth":
            return signal.sawtooth(2 * np.pi * frequency * t)
        elif waveform == "triangle":
            return signal.sawtooth(2 * np.pi * frequency * t, 0.5)
        else:
            raise ValueError(f"Unsupported waveform type: {waveform}")

    def _apply_envelope(
        self, audio: np.ndarray, envelope: Dict[str, float]
    ) -> np.ndarray:
        """Apply ADSR envelope to audio."""
        total_samples = len(audio)
        attack_samples = int(envelope["attack"] * self.sample_rate)
        decay_samples = int(envelope["decay"] * self.sample_rate)
        release_samples = int(envelope["release"] * self.sample_rate)

        envelope_curve = np.ones(total_samples)

        # Attack
        envelope_curve[:attack_samples] = np.linspace(0, 1, attack_samples)

        # Decay
        decay_end = attack_samples + decay_samples
        envelope_curve[attack_samples:decay_end] = np.linspace(
            1, envelope["sustain"], decay_samples
        )

        # Sustain
        sustain_samples = total_samples - release_samples - decay_end
        if sustain_samples > 0:
            envelope_curve[decay_end:-release_samples] = envelope["sustain"]

        # Release
        envelope_curve[-release_samples:] = np.linspace(
            envelope["sustain"], 0, release_samples
        )

        return audio * envelope_curve

    def _apply_filter(
        self, audio: np.ndarray, filter_params: Dict[str, Any]
    ) -> np.ndarray:
        """Apply filter to audio."""
        nyquist = self.sample_rate / 2
        normalized_cutoff = filter_params["cutoff"] / nyquist

        if filter_params["type"] == "lowpass":
            b, a = signal.butter(2, normalized_cutoff, "low")
        elif filter_params["type"] == "highpass":
            b, a = signal.butter(2, normalized_cutoff, "high")
        elif filter_params["type"] == "bandpass":
            b, a = signal.butter(2, [normalized_cutoff / 2, normalized_cutoff], "band")
        else:
            raise ValueError(f"Unsupported filter type: {filter_params['type']}")

        return signal.filtfilt(b, a, audio)

    def synthesize_note(
        self,
        frequency: float,
        duration: float,
        oscillator_name: Optional[str] = None,
        envelope_name: Optional[str] = None,
        filter_name: Optional[str] = None,
    ) -> np.ndarray:
        """Synthesize a single note."""
        # Generate base waveform
        if oscillator_name and oscillator_name in self._oscillators:
            osc = self._oscillators[oscillator_name]
            audio = (
                self._generate_waveform(frequency, duration, osc["waveform"])
                * osc["amplitude"]
            )
        else:
            audio = self._generate_waveform(frequency, duration)

        # Apply envelope
        if envelope_name and envelope_name in self._envelopes:
            audio = self._apply_envelope(audio, self._envelopes[envelope_name])

        # Apply filter
        if filter_name and filter_name in self._filters:
            audio = self._apply_filter(audio, self._filters[filter_name])

        return audio

    def play_note(self, frequency: float, duration: float, **kwargs) -> None:
        """Synthesize and play a note in real-time."""
        audio = self.synthesize_note(frequency, duration, **kwargs)
        sd.play(audio, self.sample_rate)
        sd.wait()

    def synthesize_midi(
        self, midi_data: pretty_midi.PrettyMIDI, **kwargs
    ) -> np.ndarray:
        """Synthesize audio from MIDI data."""
        # Get total duration
        duration = midi_data.get_end_time()
        output = np.zeros(int(self.sample_rate * duration))

        # Process each instrument
        for instrument in midi_data.instruments:
            for note in instrument.notes:
                # Convert MIDI note to frequency
                frequency = 440.0 * (2.0 ** ((note.pitch - 69) / 12.0))

                # Synthesize note
                note_audio = self.synthesize_note(
                    frequency=frequency, duration=note.end - note.start, **kwargs
                )

                # Add to output at correct position
                start_idx = int(note.start * self.sample_rate)
                end_idx = start_idx + len(note_audio)
                output[start_idx:end_idx] += note_audio * (note.velocity / 127.0)

        return np.clip(output, -1, 1)
