import numpy as np
from scipy.io import wavfile
from scipy import signal
import io
from typing import List, Optional, Tuple

try:
    import librosa

    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False

try:
    from pydub import AudioSegment

    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False

import tempfile
import os
import hashlib


def note_to_hz(note: str) -> float:
    """Convert a note name to its frequency in Hz."""
    if LIBROSA_AVAILABLE:
        return librosa.note_to_hz(note)

    # Fallback implementation for note to frequency conversion
    note_values = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
    note_name = note[0].upper()
    octave = int(note[-1])

    # Calculate semitones from A4 (440 Hz)
    base_octave = 4
    base_note = "A"

    semitones = (octave - base_octave) * 12
    semitones += note_values[note_name] - note_values[base_note]

    # Use equal temperament formula: f = 440 * 2^(n/12)
    return 440 * (2 ** (semitones / 12))


class AudioProcessor:
    def __init__(self, sample_rate: int = 44100):
        self.sample_rate = sample_rate
        self.supported_formats = ["wav"]
        if PYDUB_AVAILABLE:
            self.supported_formats.append("mp3")
        self._cache = {}  # Simple in-memory cache

    def generate_waveform(
        self,
        frequency: float,
        duration: float,
        waveform_type: str = "sine",
        harmonics: Optional[List[float]] = None,
    ) -> np.ndarray:
        """Generate a waveform of specified type with harmonics"""
        t = np.linspace(
            0, duration, int(self.sample_rate * duration), False, dtype=np.float32
        )
        harmonics = harmonics or [1.0]
        signal = np.zeros_like(t, dtype=np.float32)

        for i, amplitude in enumerate(harmonics, 1):
            if waveform_type == "sine":
                partial = amplitude * np.sin(2 * np.pi * frequency * i * t)
            elif waveform_type == "square":
                partial = amplitude * np.sign(np.sin(2 * np.pi * frequency * i * t))
            elif waveform_type == "sawtooth":
                partial = (
                    amplitude
                    * 2
                    * (frequency * i * t - np.floor(0.5 + frequency * i * t))
                )
            elif waveform_type == "triangle":
                partial = (
                    amplitude
                    * 2
                    * np.abs(
                        2 * (frequency * i * t - np.floor(0.5 + frequency * i * t))
                    )
                    - 1
                )
            else:
                raise ValueError(f"Unsupported waveform type: {waveform_type}")

            signal += partial.astype(np.float32)

        return (signal / max(abs(signal))).astype(np.float32)  # Normalize

    def generate_sine_wave(self, frequency: float, duration: float) -> np.ndarray:
        """Generate a sine wave of given frequency and duration"""
        t = np.linspace(
            0, duration, int(self.sample_rate * duration), False, dtype=np.float32
        )
        return np.sin(2 * np.pi * frequency * t).astype(np.float32)

    def normalize_audio(self, signal: np.ndarray) -> np.ndarray:
        """Normalize audio signal to range [-1, 1]"""
        if len(signal) == 0:
            return signal.astype(np.float32)
        max_val = max(abs(signal.min()), abs(signal.max()))
        if max_val > 0:
            return (signal / max_val).astype(np.float32)
        return signal.astype(np.float32)

    def apply_effects(self, signal: np.ndarray, effects: dict) -> np.ndarray:
        """Apply multiple effects to the signal"""
        processed = signal.copy().astype(np.float32)

        if "reverb" in effects:
            processed = self.apply_reverb(processed, effects["reverb"])
        if "delay" in effects:
            processed = self.apply_delay(processed, effects["delay"])
        if "filter_cutoff" in effects:
            processed = self.apply_filter(processed, effects["filter_cutoff"])

        return self.normalize_audio(processed)

    def apply_envelope(
        self,
        signal: np.ndarray,
        envelope: dict = None,
        attack: float = 0.1,
        decay: float = 0.1,
        sustain: float = 0.7,
        release: float = 0.2,
    ) -> np.ndarray:
        """Apply ADSR envelope to the signal"""
        if envelope is not None:
            attack = envelope.get("attack", attack)
            decay = envelope.get("decay", decay)
            sustain = envelope.get("sustain", sustain)
            release = envelope.get("release", release)

        samples = len(signal)
        env = np.zeros(samples, dtype=np.float32)

        attack_samples = int(attack * self.sample_rate)
        decay_samples = int(decay * self.sample_rate)
        release_samples = int(release * self.sample_rate)
        sustain_samples = samples - attack_samples - decay_samples - release_samples

        # Attack
        if attack_samples > 0:
            env[:attack_samples] = np.linspace(0, 1, attack_samples, dtype=np.float32)
        # Decay
        if decay_samples > 0:
            env[attack_samples : attack_samples + decay_samples] = np.linspace(
                1, sustain, decay_samples, dtype=np.float32
            )
        # Sustain
        if sustain_samples > 0:
            env[attack_samples + decay_samples : -release_samples] = sustain
        # Release
        if release_samples > 0:
            env[-release_samples:] = np.linspace(
                sustain, 0, release_samples, dtype=np.float32
            )

        return (signal * env).astype(np.float32)

    def apply_reverb(self, signal: np.ndarray, amount: float = 0.3) -> np.ndarray:
        """Apply reverb effect to the signal"""
        if amount == 0:
            return signal.astype(np.float32)

        # Create impulse response
        decay = int(amount * self.sample_rate)
        impulse_response = np.exp(-np.linspace(0, 5, decay)).astype(np.float32)

        # Convolve signal with impulse response
        reverb_signal = np.convolve(
            signal.astype(np.float32), impulse_response, mode="full"
        )[: len(signal)]

        # Mix dry and wet signals
        return ((1 - amount) * signal + amount * reverb_signal).astype(np.float32)

    def apply_delay(
        self, signal: np.ndarray, delay_time: float = 0.3, feedback: float = 0.3
    ) -> np.ndarray:
        """Apply delay effect to the signal"""
        if delay_time == 0:
            return signal.astype(np.float32)

        delay_samples = int(delay_time * self.sample_rate)
        delayed_signal = np.zeros_like(signal, dtype=np.float32)
        delayed_signal[delay_samples:] = signal[:-delay_samples]

        # Apply feedback
        result = signal + feedback * delayed_signal

        return (result / max(abs(result))).astype(np.float32)  # Normalize

    def apply_filter(
        self,
        input_signal: np.ndarray,
        cutoff_freq: float,
        resonance: float = 1.0,
        filter_type: str = "lowpass",
    ) -> np.ndarray:
        """Apply filter to the signal"""
        # Normalize cutoff frequency
        nyquist = self.sample_rate / 2
        normalized_cutoff = cutoff_freq / nyquist

        # Create and apply filter
        b, a = signal.butter(4, normalized_cutoff, filter_type)
        filtered = signal.filtfilt(b, a, input_signal.astype(np.float32))

        return filtered.astype(np.float32)

    def generate_audio(
        self, parameters: dict, duration: float
    ) -> Tuple[np.ndarray, int]:
        """Generate audio based on music parameters"""
        # Generate base waveform
        frequency = note_to_hz(parameters["key"] + "4")  # Default octave 4
        signal = self.generate_waveform(
            frequency=frequency,
            duration=duration,
            waveform_type=parameters["waveform"],
            harmonics=parameters.get("harmonics", [1.0]),
        )

        # Apply envelope
        signal = self.apply_envelope(signal)

        # Apply effects
        if parameters.get("filter_freq"):
            signal = self.apply_filter(
                signal,
                parameters["filter_freq"],
                parameters.get("filter_resonance", 1.0),
            )

        if parameters.get("reverb", 0) > 0:
            signal = self.apply_reverb(signal, parameters["reverb"])

        if parameters.get("delay", 0) > 0:
            signal = self.apply_delay(signal, parameters["delay"])

        # Apply volume
        signal *= parameters.get("volume", 0.8)

        return signal, self.sample_rate

    def export_audio(self, signal: np.ndarray, format: str = "wav") -> io.BytesIO:
        """Export audio signal to specified format"""
        if format not in self.supported_formats:
            if format == "mp3" and not PYDUB_AVAILABLE:
                raise ValueError("MP3 export requires pydub to be installed")
            raise ValueError(f"Unsupported format: {format}")

        # Convert to 16-bit PCM
        signal_16bit = np.int16(signal * 32767)

        # Create in-memory file
        buffer = io.BytesIO()

        # Create a temporary WAV file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_wav:
            wavfile.write(temp_wav.name, self.sample_rate, signal_16bit)

            if format == "wav":
                # For WAV, just read and return the file
                with open(temp_wav.name, "rb") as wav_file:
                    buffer.write(wav_file.read())
            elif format == "mp3":
                # For MP3, convert using pydub
                audio = AudioSegment.from_wav(temp_wav.name)
                with tempfile.NamedTemporaryFile(
                    suffix=".mp3", delete=False
                ) as temp_mp3:
                    audio.export(temp_mp3.name, format="mp3", bitrate="192k")
                    with open(temp_mp3.name, "rb") as mp3_file:
                        buffer.write(mp3_file.read())
                    os.unlink(temp_mp3.name)

        # Clean up temporary WAV file
        os.unlink(temp_wav.name)

        buffer.seek(0)
        return buffer

    def _get_cache_key(self, parameters: dict, duration: float) -> str:
        """Generate a cache key from parameters"""
        param_str = f"{parameters}_{duration}"
        return hashlib.md5(param_str.encode()).hexdigest()

    def generate_audio_cached(
        self, parameters: dict, duration: float
    ) -> Tuple[np.ndarray, int]:
        """Generate audio with caching"""
        cache_key = self._get_cache_key(parameters, duration)

        if cache_key in self._cache:
            return self._cache[cache_key]

        signal, sample_rate = self.generate_audio(parameters, duration)
        self._cache[cache_key] = (signal, sample_rate)

        # Limit cache size
        if len(self._cache) > 100:  # Keep only last 100 items
            self._cache.pop(next(iter(self._cache)))

        return signal, sample_rate
