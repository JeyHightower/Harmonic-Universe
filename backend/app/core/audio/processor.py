from typing import Dict, Any, Optional, Tuple, Union
import numpy as np
import librosa
import soundfile as sf
import midiutil
import pretty_midi
import io
import base64
from pathlib import Path
import signal
from scipy import signal as scipy_signal

from app.models.audio.audio_file import AudioFormat
from app.core.config import settings

class AudioProcessor:
    def __init__(self, file_path: str, format: AudioFormat):
        self._file_path = file_path
        self._format = format
        self._audio_data = None
        self._sample_rate = None

    @property
    def audio_data(self) -> np.ndarray:
        if self._audio_data is None:
            self._load_audio()
        return self._audio_data

    @property
    def sample_rate(self) -> int:
        if self._sample_rate is None:
            self._load_audio()
        return self._sample_rate

    def _load_audio(self):
        """Load audio file into memory."""
        if self._format == AudioFormat.MIDI:
            raise ValueError("Cannot load MIDI files as audio data")
        self._audio_data, self._sample_rate = librosa.load(self._file_path, sr=None)

    def get_duration(self) -> float:
        """Get audio duration in seconds."""
        if self._format == AudioFormat.MIDI:
            midi_data = pretty_midi.PrettyMIDI(self._file_path)
            return midi_data.get_end_time()
        return len(self.audio_data) / self.sample_rate

    def get_waveform_data(self, num_points: int = 1000) -> Dict[str, list]:
        """Generate waveform visualization data."""
        if self._format == AudioFormat.MIDI:
            raise ValueError("Cannot generate waveform data for MIDI files")

        # Compute waveform envelope
        if len(self.audio_data) > num_points:
            samples_per_point = len(self.audio_data) // num_points
            waveform = np.array([
                np.max(self.audio_data[i:i+samples_per_point])
                for i in range(0, len(self.audio_data), samples_per_point)
            ])[:num_points]
        else:
            waveform = self.audio_data

        return {
            "points": waveform.tolist(),
            "sample_rate": self.sample_rate,
            "duration": self.get_duration()
        }

    def convert_format(self, target_format: AudioFormat, output_path: Optional[str] = None) -> str:
        """Convert audio to different format."""
        if output_path is None:
            output_path = str(Path(self._file_path).with_suffix(f".{target_format}"))

        if self._format == AudioFormat.MIDI and target_format != AudioFormat.MIDI:
            # Convert MIDI to audio using a synthesizer
            midi_data = pretty_midi.PrettyMIDI(self._file_path)
            audio_data = midi_data.synthesize()
            sf.write(output_path, audio_data, midi_data.resolution)
        elif self._format != AudioFormat.MIDI and target_format == AudioFormat.MIDI:
            raise ValueError("Cannot convert audio to MIDI format")
        else:
            # Convert between audio formats
            sf.write(output_path, self.audio_data, self.sample_rate)

        return output_path

    def apply_effects(self, effects: Dict[str, Any]) -> None:
        """Apply audio effects to the loaded audio."""
        if self._format == AudioFormat.MIDI:
            raise ValueError("Cannot apply audio effects to MIDI files")

        for effect, params in effects.items():
            if effect == "normalize":
                print(f"Before normalization: {np.max(np.abs(self.audio_data))}")
                self._audio_data = librosa.util.normalize(self.audio_data)
                print(f"After normalization: {np.max(np.abs(self.audio_data))}")
            elif effect == "pitch_shift":
                self._audio_data = librosa.effects.pitch_shift(
                    y=self.audio_data,
                    sr=self.sample_rate,
                    n_steps=params.get("steps", 0)
                )
            elif effect == "time_stretch":
                self._audio_data = librosa.effects.time_stretch(
                    y=self.audio_data,
                    rate=params.get("rate", 1.0)
                )
            # Add more effects as needed

    def save(self, output_path: Optional[str] = None) -> str:
        """Save processed audio to file."""
        if output_path is None:
            output_path = self._file_path

        if self._format == AudioFormat.MIDI:
            raise ValueError("Cannot save MIDI files with audio processor")

        sf.write(output_path, self.audio_data, self.sample_rate)
        return output_path

    def to_base64(self) -> Tuple[str, str]:
        """Convert audio to base64 string."""
        buffer = io.BytesIO()

        if self._format == AudioFormat.MIDI:
            with open(self._file_path, 'rb') as f:
                buffer.write(f.read())
            mime_type = "audio/midi"
        else:
            sf.write(buffer, self.audio_data, self.sample_rate, format=self._format)
            mime_type = f"audio/{self._format}"

        buffer.seek(0)
        return base64.b64encode(buffer.getvalue()).decode(), mime_type

    def save_audio(self, file_path: Union[str, Path], audio_data: np.ndarray, sample_rate: int) -> None:
        """Save audio data to a file.

        Args:
            file_path: Path to save the audio file
            audio_data: The audio data to save
            sample_rate: The sample rate of the audio data
        """
        # Convert to float64 for maximum precision
        audio_data = audio_data.astype(np.float64)

        # Normalize if needed
        if np.max(np.abs(audio_data)) > 1.0:
            audio_data = self.normalize(audio_data)

        # Convert to Path object if string
        if isinstance(file_path, str):
            file_path = Path(file_path)

        # Save with maximum precision
        sf.write(str(file_path), audio_data, sample_rate, subtype='DOUBLE')

    def normalize(self, audio_data: np.ndarray) -> np.ndarray:
        """Normalize audio data to the range [-1, 1].

        Args:
            audio_data: The audio data to normalize

        Returns:
            The normalized audio data
        """
        # Convert to float64 for maximum precision
        audio_data = audio_data.astype(np.float64)
        max_val = np.max(np.abs(audio_data))
        if max_val > 0:
            return audio_data / max_val
        return audio_data

    def analyze_frequency_content(self, audio_data: np.ndarray, sample_rate: int) -> Tuple[np.ndarray, np.ndarray]:
        """Analyze the frequency content of the audio data using STFT.

        Args:
            audio_data: The audio data to analyze
            sample_rate: The sample rate of the audio data

        Returns:
            A tuple of (frequencies, magnitudes)
        """
        # Use a larger window size for better frequency resolution
        n_fft = 32768  # Increased for maximum resolution
        hop_length = n_fft // 4
        win_length = n_fft
        window = scipy_signal.windows.kaiser(win_length, beta=14)  # Kaiser window with high sidelobe attenuation

        # Zero-pad the signal for better frequency resolution
        padded_length = len(audio_data) + n_fft
        padded_signal = np.pad(audio_data, (n_fft//2, n_fft//2), mode='reflect')

        # Compute STFT
        stft = librosa.stft(
            padded_signal,
            n_fft=n_fft,
            hop_length=hop_length,
            win_length=win_length,
            window=window,
            center=True,
            pad_mode='reflect'
        )

        # Calculate magnitudes
        magnitudes = np.abs(stft)

        # Calculate frequencies
        frequencies = librosa.fft_frequencies(sr=sample_rate, n_fft=n_fft)

        # Average magnitudes across time and normalize
        avg_magnitudes = np.mean(magnitudes, axis=1)
        avg_magnitudes = avg_magnitudes / np.max(avg_magnitudes)

        # Apply peak enhancement and smoothing
        avg_magnitudes = np.power(avg_magnitudes, 2)  # Emphasize peaks
        avg_magnitudes = scipy_signal.savgol_filter(avg_magnitudes, 11, 3)  # Smooth the spectrum

        # Find the most prominent peak
        peak_idx = np.argmax(avg_magnitudes)

        # Quadratic interpolation for more precise frequency estimation
        if 0 < peak_idx < len(frequencies) - 1:
            alpha = avg_magnitudes[peak_idx-1]
            beta = avg_magnitudes[peak_idx]
            gamma = avg_magnitudes[peak_idx+1]
            p = 0.5 * (alpha - gamma) / (alpha - 2*beta + gamma)
            frequencies = np.array([frequencies[peak_idx] + p * (frequencies[peak_idx+1] - frequencies[peak_idx])])
            avg_magnitudes = np.array([beta - 0.25 * (alpha - gamma) * p])

        return frequencies, avg_magnitudes

    def apply_reverb(self, audio_data: np.ndarray, sample_rate: int) -> np.ndarray:
        """Apply reverb effect to the audio data.

        Args:
            audio_data: The audio data to process
            sample_rate: The sample rate of the audio data

        Returns:
            The processed audio data with reverb effect
        """
        # Create a simple reverb effect using delayed copies of the signal
        delays = [int(sample_rate * t) for t in [0.03, 0.05, 0.07]]  # Multiple delay times
        decay = [0.3, 0.2, 0.1]  # Corresponding decay factors

        output = np.copy(audio_data)
        for delay, amp in zip(delays, decay):
            delayed = np.zeros_like(audio_data)
            delayed[delay:] = audio_data[:-delay] * amp
            output += delayed

        return self.normalize(output)

    def apply_distortion(self, audio_data: np.ndarray, gain: float = 2.0) -> np.ndarray:
        """Apply distortion effect to the audio data.

        Args:
            audio_data: The audio data to process
            gain: The distortion gain factor

        Returns:
            The processed audio data with distortion effect
        """
        # Convert to float64 for maximum precision
        audio_data = audio_data.astype(np.float64)

        # Apply gain
        amplified = audio_data * gain

        # Clip the signal to create distortion
        clipped = np.clip(amplified, -1.0, 1.0)

        # Normalize the output
        return self.normalize(clipped)

    def load_audio(self, file_path: Union[str, Path]) -> Tuple[np.ndarray, int]:
        """Load audio data from a file.

        Args:
            file_path: Path to the audio file

        Returns:
            Tuple of (audio_data, sample_rate)
        """
        audio_data, sample_rate = librosa.load(str(file_path), sr=None)
        return audio_data, sample_rate

    def resample(self, audio_data: np.ndarray, orig_sr: int, target_sr: int) -> np.ndarray:
        """Resample audio data to a new sample rate."""
        return librosa.resample(y=audio_data, orig_sr=orig_sr, target_sr=target_sr)

    def apply_delay(self, audio_data: np.ndarray, sample_rate: int, delay_time: float, feedback: float = 0.5) -> np.ndarray:
        """Apply a delay effect to the audio data.

        Args:
            audio_data: The audio data to process
            sample_rate: The sample rate of the audio data
            delay_time: The delay time in seconds
            feedback: The feedback coefficient (0 to 1)

        Returns:
            The processed audio data with delay effect
        """
        delay_samples = int(delay_time * sample_rate)
        output = np.zeros(len(audio_data) + delay_samples)
        output[:len(audio_data)] = audio_data

        # Apply delay with feedback
        delayed = np.roll(audio_data, delay_samples)
        output[delay_samples:] += delayed[:len(output)-delay_samples] * feedback

        return output

    def apply_filter(self, audio_data: np.ndarray, sample_rate: int, cutoff: float, filter_type: str = "lowpass") -> np.ndarray:
        """Apply a filter to the audio data.

        Args:
            audio_data: The audio data to filter
            sample_rate: The sample rate of the audio data
            cutoff: The cutoff frequency in Hz
            filter_type: The type of filter to apply ("lowpass" or "highpass")

        Returns:
            The filtered audio data
        """
        nyquist = sample_rate / 2
        normalized_cutoff = cutoff / nyquist
        b, a = scipy_signal.butter(4, normalized_cutoff, btype=filter_type)
        return scipy_signal.filtfilt(b, a, audio_data)

    def detect_envelope(self, audio_data: np.ndarray) -> np.ndarray:
        """Detect the amplitude envelope of the audio data.

        Args:
            audio_data: The audio data to analyze

        Returns:
            The amplitude envelope of the audio data
        """
        # Convert to float64 for maximum precision
        audio_data = audio_data.astype(np.float64)

        # Calculate the absolute value of the signal
        abs_signal = np.abs(audio_data)

        # Use a moving average filter to smooth the envelope
        window_size = 2048  # Adjust based on your needs
        window = np.ones(window_size) / window_size
        envelope = scipy_signal.convolve(abs_signal, window, mode='same')

        return envelope

    def detect_onsets(self, audio_data: np.ndarray, sample_rate: int) -> np.ndarray:
        """Detect note onsets in the audio data.

        Args:
            audio_data: The audio data to analyze
            sample_rate: The sample rate of the audio data

        Returns:
            Array of onset times in seconds
        """
        # Convert to float64 for maximum precision
        audio_data = audio_data.astype(np.float64)

        # Compute onset envelope
        onset_env = librosa.onset.onset_strength(
            y=audio_data,
            sr=sample_rate,
            hop_length=512,
            aggregate=np.median
        )

        # Detect onsets
        onset_frames = librosa.onset.onset_detect(
            onset_envelope=onset_env,
            sr=sample_rate,
            hop_length=512,
            units='frames'
        )

        # Convert frames to time
        onset_times = librosa.frames_to_time(onset_frames, sr=sample_rate, hop_length=512)

        return onset_times
