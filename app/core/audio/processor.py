import numpy as np
import librosa
import soundfile as sf
from scipy import signal as scipy_signal
from typing import Tuple, Optional, Union
from pathlib import Path
from enum import Enum

class AudioProcessor:
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

    def analyze_frequency_content(self, audio_data: np.ndarray, sample_rate: int) -> Tuple[np.ndarray, np.ndarray]:
        """Analyze the frequency content of the audio data using STFT.

        Args:
            audio_data: The audio data to analyze
            sample_rate: The sample rate of the audio data

        Returns:
            A tuple of (frequencies, magnitudes)
        """
        # Use a larger window size for better frequency resolution
        n_fft = 16384  # Increased for even better resolution
        hop_length = n_fft // 4
        win_length = n_fft
        window = scipy_signal.windows.blackman(win_length, sym=True)  # Using Blackman window for better frequency resolution

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

        # Apply peak enhancement
        avg_magnitudes = np.power(avg_magnitudes, 2)  # Emphasize peaks

        return frequencies, avg_magnitudes

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

        # Add delayed signal
        for i in range(len(audio_data)):
            if i + delay_samples < len(output):
                output[i + delay_samples] += audio_data[i] * feedback

        return output

    def apply_distortion(self, audio_data: np.ndarray, gain: float = 2.0) -> np.ndarray:
        """Apply distortion effect to the audio data.

        Args:
            audio_data: The audio data to process
            gain: The distortion gain factor

        Returns:
            The processed audio data with distortion effect
        """
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
        # Convert to Path object if string
        if isinstance(file_path, str):
            file_path = Path(file_path)

        # Load audio file with maximum precision
        audio_data, sample_rate = librosa.load(str(file_path), sr=None, dtype=np.float64)

        # Ensure consistent data type
        audio_data = audio_data.astype(np.float64)

        # Normalize if needed
        if np.max(np.abs(audio_data)) > 1.0:
            audio_data = self.normalize(audio_data)

        return audio_data, sample_rate

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
        sf.write(str(file_path), audio_data, sample_rate, subtype='FLOAT')
