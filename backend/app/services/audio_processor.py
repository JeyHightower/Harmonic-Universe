import numpy as np
from scipy.io import wavfile
from scipy import signal
import io
from typing import List, Optional, Tuple
import librosa
from pydub import AudioSegment
import tempfile
import os
import hashlib

class AudioProcessor:
    def __init__(self, sample_rate: int = 44100):
        self.sample_rate = sample_rate
        self.supported_formats = ['wav', 'mp3']
        self._cache = {}  # Simple in-memory cache

    def generate_waveform(self,
                         frequency: float,
                         duration: float,
                         waveform_type: str = 'sine',
                         harmonics: Optional[List[float]] = None) -> np.ndarray:
        """Generate a waveform of specified type with harmonics"""
        t = np.linspace(0, duration, int(self.sample_rate * duration), False)
        harmonics = harmonics or [1.0]
        signal = np.zeros_like(t)

        for i, amplitude in enumerate(harmonics, 1):
            if waveform_type == 'sine':
                partial = amplitude * np.sin(2 * np.pi * frequency * i * t)
            elif waveform_type == 'square':
                partial = amplitude * np.sign(np.sin(2 * np.pi * frequency * i * t))
            elif waveform_type == 'sawtooth':
                partial = amplitude * 2 * (frequency * i * t - np.floor(0.5 + frequency * i * t))
            elif waveform_type == 'triangle':
                partial = amplitude * 2 * np.abs(2 * (frequency * i * t - np.floor(0.5 + frequency * i * t))) - 1
            else:
                raise ValueError(f"Unsupported waveform type: {waveform_type}")

            signal += partial

        return signal / max(abs(signal))  # Normalize

    def apply_envelope(self,
                      signal: np.ndarray,
                      attack: float = 0.1,
                      decay: float = 0.1,
                      sustain: float = 0.7,
                      release: float = 0.2) -> np.ndarray:
        """Apply ADSR envelope to the signal"""
        samples = len(signal)
        envelope = np.zeros(samples)

        attack_samples = int(attack * self.sample_rate)
        decay_samples = int(decay * self.sample_rate)
        release_samples = int(release * self.sample_rate)
        sustain_samples = samples - attack_samples - decay_samples - release_samples

        # Attack
        envelope[:attack_samples] = np.linspace(0, 1, attack_samples)
        # Decay
        envelope[attack_samples:attack_samples + decay_samples] = \
            np.linspace(1, sustain, decay_samples)
        # Sustain
        envelope[attack_samples + decay_samples:-release_samples] = sustain
        # Release
        envelope[-release_samples:] = np.linspace(sustain, 0, release_samples)

        return signal * envelope

    def apply_reverb(self, signal: np.ndarray, amount: float = 0.3) -> np.ndarray:
        """Apply reverb effect to the signal"""
        if amount == 0:
            return signal

        # Create impulse response
        decay = int(amount * self.sample_rate)
        impulse_response = np.exp(-np.linspace(0, 5, decay))

        # Convolve signal with impulse response
        reverb_signal = np.convolve(signal, impulse_response, mode='full')[:len(signal)]

        # Mix dry and wet signals
        return (1 - amount) * signal + amount * reverb_signal

    def apply_delay(self, signal: np.ndarray, delay_time: float = 0.3, feedback: float = 0.3) -> np.ndarray:
        """Apply delay effect to the signal"""
        if delay_time == 0:
            return signal

        delay_samples = int(delay_time * self.sample_rate)
        delayed_signal = np.zeros_like(signal)
        delayed_signal[delay_samples:] = signal[:-delay_samples]

        # Apply feedback
        result = signal + feedback * delayed_signal

        return result / max(abs(result))  # Normalize

    def apply_filter(self,
                    input_signal: np.ndarray,
                    cutoff_freq: float,
                    resonance: float = 1.0,
                    filter_type: str = 'lowpass') -> np.ndarray:
        """Apply filter to the signal"""
        # Normalize cutoff frequency
        nyquist = self.sample_rate / 2
        normalized_cutoff = cutoff_freq / nyquist

        # Create and apply filter
        b, a = signal.butter(4, normalized_cutoff, filter_type)
        filtered = signal.filtfilt(b, a, input_signal)

        return filtered

    def generate_audio(self, parameters: dict, duration: float) -> Tuple[np.ndarray, int]:
        """Generate audio based on music parameters"""
        # Generate base waveform
        frequency = librosa.note_to_hz(parameters['key'] + '4')  # Default octave 4
        signal = self.generate_waveform(
            frequency=frequency,
            duration=duration,
            waveform_type=parameters['waveform'],
            harmonics=parameters.get('harmonics', [1.0])
        )

        # Apply envelope
        signal = self.apply_envelope(signal)

        # Apply effects
        if parameters.get('filter_freq'):
            signal = self.apply_filter(
                signal,
                parameters['filter_freq'],
                parameters.get('filter_resonance', 1.0)
            )

        if parameters.get('reverb', 0) > 0:
            signal = self.apply_reverb(signal, parameters['reverb'])

        if parameters.get('delay', 0) > 0:
            signal = self.apply_delay(signal, parameters['delay'])

        # Apply volume
        signal *= parameters.get('volume', 0.8)

        return signal, self.sample_rate

    def export_audio(self, signal: np.ndarray, format: str = 'wav') -> io.BytesIO:
        """Export audio signal to specified format"""
        if format not in self.supported_formats:
            raise ValueError(f"Unsupported format: {format}")

        # Convert to 16-bit PCM
        signal_16bit = np.int16(signal * 32767)

        # Create in-memory file
        buffer = io.BytesIO()

        # Create a temporary WAV file
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav:
            wavfile.write(temp_wav.name, self.sample_rate, signal_16bit)

            if format == 'wav':
                # For WAV, just read and return the file
                with open(temp_wav.name, 'rb') as wav_file:
                    buffer.write(wav_file.read())
            elif format == 'mp3':
                # For MP3, convert using pydub
                audio = AudioSegment.from_wav(temp_wav.name)

                # Create a temporary MP3 file
                with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_mp3:
                    audio.export(temp_mp3.name, format='mp3', bitrate='192k')

                    # Read the MP3 file into our buffer
                    with open(temp_mp3.name, 'rb') as mp3_file:
                        buffer.write(mp3_file.read())

                # Clean up temporary MP3 file
                os.unlink(temp_mp3.name)

        # Clean up temporary WAV file
        os.unlink(temp_wav.name)

        buffer.seek(0)
        return buffer

    def _get_cache_key(self, parameters: dict, duration: float) -> str:
        """Generate a cache key from parameters"""
        param_str = f"{parameters}_{duration}"
        return hashlib.md5(param_str.encode()).hexdigest()

    def generate_audio_cached(self, parameters: dict, duration: float) -> Tuple[np.ndarray, int]:
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
