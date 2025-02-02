from typing import Dict, Any, Optional, Tuple
import numpy as np
import librosa
import soundfile as sf
import midiutil
import pretty_midi
import io
import base64
from pathlib import Path

from app.models.audio_file import AudioFormat
from app.core.config import settings

class AudioProcessor:
    def __init__(self, file_path: str, format: AudioFormat):
        self.file_path = file_path
        self.format = format
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
        if self.format == AudioFormat.MIDI:
            raise ValueError("Cannot load MIDI files as audio data")
        self._audio_data, self._sample_rate = librosa.load(self.file_path, sr=None)

    def get_duration(self) -> float:
        """Get audio duration in seconds."""
        if self.format == AudioFormat.MIDI:
            midi_data = pretty_midi.PrettyMIDI(self.file_path)
            return midi_data.get_end_time()
        return len(self.audio_data) / self.sample_rate

    def get_waveform_data(self, num_points: int = 1000) -> Dict[str, list]:
        """Generate waveform visualization data."""
        if self.format == AudioFormat.MIDI:
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
            output_path = str(Path(self.file_path).with_suffix(f".{target_format}"))

        if self.format == AudioFormat.MIDI and target_format != AudioFormat.MIDI:
            # Convert MIDI to audio using a synthesizer
            midi_data = pretty_midi.PrettyMIDI(self.file_path)
            audio_data = midi_data.synthesize()
            sf.write(output_path, audio_data, midi_data.resolution)
        elif self.format != AudioFormat.MIDI and target_format == AudioFormat.MIDI:
            raise ValueError("Cannot convert audio to MIDI format")
        else:
            # Convert between audio formats
            sf.write(output_path, self.audio_data, self.sample_rate)

        return output_path

    def apply_effects(self, effects: Dict[str, Any]) -> None:
        """Apply audio effects to the loaded audio."""
        if self.format == AudioFormat.MIDI:
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
            output_path = self.file_path

        if self.format == AudioFormat.MIDI:
            raise ValueError("Cannot save MIDI files with audio processor")

        sf.write(output_path, self.audio_data, self.sample_rate)
        return output_path

    def to_base64(self) -> Tuple[str, str]:
        """Convert audio to base64 string."""
        buffer = io.BytesIO()

        if self.format == AudioFormat.MIDI:
            with open(self.file_path, 'rb') as f:
                buffer.write(f.read())
            mime_type = "audio/midi"
        else:
            sf.write(buffer, self.audio_data, self.sample_rate, format=self.format)
            mime_type = f"audio/{self.format}"

        buffer.seek(0)
        return base64.b64encode(buffer.getvalue()).decode(), mime_type
