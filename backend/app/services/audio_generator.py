import numpy as np
import soundfile as sf
import sounddevice as sd
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

class AudioGenerator:
    def __init__(self):
        self.sample_rate = 44100
        self.channels = 2
        self.base_frequency = 440  # A4 note
        self.current_buffer = None
        self.is_playing = False

    def generate_harmony(self, physics_params: Dict) -> np.ndarray:
        """Generate audio based on physics parameters."""
        try:
            # Extract parameters
            gravity = physics_params.get('gravity', 9.81)
            harmony = physics_params.get('harmony', 1.0)

            # Calculate frequency modulation
            frequency = self.base_frequency * harmony
            duration = 2.0  # seconds
            t = np.linspace(0, duration, int(self.sample_rate * duration))

            # Generate sine wave
            signal = np.sin(2 * np.pi * frequency * t)

            # Apply gravity-based amplitude modulation
            amplitude = np.exp(-gravity * t / 10)
            modulated_signal = signal * amplitude

            # Convert to stereo
            stereo_signal = np.vstack((modulated_signal, modulated_signal)).T

            # Normalize
            stereo_signal = stereo_signal / np.max(np.abs(stereo_signal))

            self.current_buffer = stereo_signal
            return stereo_signal

        except Exception as e:
            logger.error(f"Error generating harmony: {e}", exc_info=True)
            return np.zeros((int(self.sample_rate * 2), 2))

    def play_buffer(self) -> None:
        """Play the current audio buffer."""
        if self.current_buffer is not None and not self.is_playing:
            try:
                self.is_playing = True
                sd.play(self.current_buffer, self.sample_rate)
                sd.wait()
            except Exception as e:
                logger.error(f"Error playing audio: {e}", exc_info=True)
            finally:
                self.is_playing = False

    def stop_playback(self) -> None:
        """Stop current audio playback."""
        if self.is_playing:
            try:
                sd.stop()
                self.is_playing = False
            except Exception as e:
                logger.error(f"Error stopping audio: {e}", exc_info=True)

    def save_to_file(self, filepath: str) -> bool:
        """Save current buffer to a WAV file."""
        if self.current_buffer is not None:
            try:
                sf.write(filepath, self.current_buffer, self.sample_rate)
                return True
            except Exception as e:
                logger.error(f"Error saving audio file: {e}", exc_info=True)
        return False
