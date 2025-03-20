import numpy as np
from scipy import signal
from typing import Tuple, Optional
import librosa
import soundfile as sf
from app.core.config import settings

class AudioProcessor:
    def __init__(
        self,
        sample_rate: int = settings.AUDIO_SAMPLE_RATE,
        hop_length: int = 512,
        n_fft: int = 2048
    ):
        self.sample_rate = sample_rate
        self.hop_length = hop_length
        self.n_fft = n_fft

    def load_audio(self, audio_data: bytes) -> Tuple[np.ndarray, int]:
        """Load audio data from bytes and return numpy array."""
        try:
            # Load audio data using soundfile
            audio_array, sr = sf.read(audio_data)

            # Convert to mono if stereo
            if len(audio_array.shape) > 1:
                audio_array = librosa.to_mono(audio_array.T)

            # Resample if necessary
            if sr != self.sample_rate:
                audio_array = librosa.resample(
                    audio_array,
                    orig_sr=sr,
                    target_sr=self.sample_rate
                )

            return audio_array, self.sample_rate

        except Exception as e:
            raise ValueError(f"Error loading audio data: {str(e)}")

    def adjust_tempo(
        self,
        audio: np.ndarray,
        target_tempo: float,
        current_tempo: Optional[float] = None
    ) -> np.ndarray:
        """Adjust the tempo of the audio."""
        try:
            if current_tempo is None:
                # Estimate current tempo
                tempo, _ = librosa.beat.beat_track(
                    y=audio,
                    sr=self.sample_rate,
                    hop_length=self.hop_length
                )
                current_tempo = tempo

            # Calculate tempo ratio
            tempo_ratio = target_tempo / current_tempo

            # Time stretch audio
            audio_stretched = librosa.effects.time_stretch(
                audio,
                rate=tempo_ratio
            )

            return audio_stretched

        except Exception as e:
            raise ValueError(f"Error adjusting tempo: {str(e)}")

    def apply_effects(
        self,
        audio: np.ndarray,
        complexity: float = 0.5
    ) -> np.ndarray:
        """Apply audio effects based on complexity parameter."""
        try:
            # Apply reverb
            if complexity > 0.3:
                audio = self._apply_reverb(audio, complexity)

            # Apply EQ
            audio = self._apply_eq(audio, complexity)

            # Apply compression
            audio = self._apply_compression(audio, complexity)

            # Normalize audio
            audio = librosa.util.normalize(audio)

            return audio

        except Exception as e:
            raise ValueError(f"Error applying effects: {str(e)}")

    def _apply_reverb(
        self,
        audio: np.ndarray,
        complexity: float
    ) -> np.ndarray:
        """Apply reverb effect to audio."""
        # Create impulse response
        reverb_length = int(self.sample_rate * (0.5 + complexity))
        impulse_response = np.exp(-6 * np.linspace(0, 1, reverb_length))
        impulse_response = np.pad(impulse_response, (0, len(audio) - len(impulse_response)))

        # Apply convolution
        audio_reverb = signal.convolve(audio, impulse_response, mode='same')

        # Mix dry and wet signals
        mix_ratio = 0.3 + (complexity * 0.4)
        return (1 - mix_ratio) * audio + mix_ratio * audio_reverb

    def _apply_eq(
        self,
        audio: np.ndarray,
        complexity: float
    ) -> np.ndarray:
        """Apply equalizer to audio."""
        # Get frequency domain representation
        stft = librosa.stft(audio, n_fft=self.n_fft, hop_length=self.hop_length)

        # Create EQ curve based on complexity
        freq_bins = np.linspace(0, 1, stft.shape[0])
        eq_curve = 1 + (complexity * 0.5 * np.sin(2 * np.pi * freq_bins * 3))
        eq_curve = eq_curve.reshape(-1, 1)

        # Apply EQ
        stft_eq = stft * eq_curve

        # Convert back to time domain
        audio_eq = librosa.istft(
            stft_eq,
            hop_length=self.hop_length,
            length=len(audio)
        )

        return audio_eq

    def _apply_compression(
        self,
        audio: np.ndarray,
        complexity: float
    ) -> np.ndarray:
        """Apply dynamic range compression to audio."""
        # Calculate threshold based on complexity
        threshold_db = -20 - (complexity * 20)

        # Convert to dB
        audio_db = librosa.amplitude_to_db(np.abs(audio))

        # Apply compression
        mask = audio_db > threshold_db
        ratio = 4
        audio_db[mask] = threshold_db + (audio_db[mask] - threshold_db) / ratio

        # Convert back to amplitude
        audio_compressed = librosa.db_to_amplitude(audio_db) * np.sign(audio)

        return audio_compressed

async def process_audio_data(
    audio_data: bytes,
    target_tempo: float,
    complexity: float
) -> np.ndarray:
    """Process audio data with specified parameters."""
    try:
        processor = AudioProcessor()

        # Load audio
        audio, _ = processor.load_audio(audio_data)

        # Adjust tempo
        audio = processor.adjust_tempo(audio, target_tempo)

        # Apply effects
        audio = processor.apply_effects(audio, complexity)

        return audio

    except Exception as e:
        raise ValueError(f"Error processing audio data: {str(e)}")

def validate_audio(audio: np.ndarray) -> bool:
    """Validate processed audio data."""
    try:
        # Check for invalid values
        if np.isnan(audio).any() or np.isinf(audio).any():
            return False

        # Check amplitude range
        if np.abs(audio).max() > 1.0:
            return False

        # Check duration
        duration = len(audio) / settings.AUDIO_SAMPLE_RATE
        if duration < 1.0 or duration > 300.0:  # 1 second to 5 minutes
            return False

        return True

    except Exception:
        return False
