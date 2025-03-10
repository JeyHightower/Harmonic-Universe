import json
import os
import tempfile
from typing import Dict, Any

import numpy as np
from scipy.io import wavfile
from backend.app.models.universe import Universe

class ExportService:
    @staticmethod
    def export_to_json(universe: Universe) -> Dict[str, Any]:
        """Export universe parameters to JSON format."""
        return {
            'name': universe.name,
            'description': universe.description,
            'physics_params': universe.physics_params,
            'harmony_params': universe.harmony_params,
            'story_points': universe.story_points,
            'created_at': universe.created_at.isoformat(),
            'updated_at': universe.updated_at.isoformat(),
        }

    @staticmethod
    def export_to_audio(universe: Universe) -> str:
        """Export universe harmony as audio file."""
        # Calculate base frequency based on gravity
        base_freq = universe.harmony_params['base_frequency'] * (universe.physics_params['gravity'] / 9.81)

        # Calculate tempo based on time dilation
        tempo = universe.harmony_params['tempo'] / universe.physics_params['time_dilation']

        # Generate audio data
        sample_rate = 44100
        duration = 4.0  # 4 seconds
        t = np.linspace(0, duration, int(sample_rate * duration))

        # Generate major scale frequencies
        ratios = [1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2]
        frequencies = [base_freq * ratio for ratio in ratios]

        # Generate chord progression
        progression = [
            [frequencies[0], frequencies[2], frequencies[4]],  # I
            [frequencies[5], frequencies[0], frequencies[2]],  # VI
            [frequencies[3], frequencies[5], frequencies[0]],  # IV
            [frequencies[4], frequencies[6], frequencies[1]],  # V
        ]

        # Generate audio data for each chord
        audio_data = np.zeros_like(t)
        chord_duration = duration / len(progression)
        samples_per_chord = int(sample_rate * chord_duration)

        for i, chord in enumerate(progression):
            start = i * samples_per_chord
            end = (i + 1) * samples_per_chord
            chord_t = t[start:end]

            # Generate sine waves for each note in the chord
            for freq in chord:
                audio_data[start:end] += np.sin(2 * np.pi * freq * chord_t)

        # Normalize and apply volume
        audio_data = audio_data / np.max(np.abs(audio_data))
        audio_data = audio_data * universe.harmony_params['volume']

        # Convert to 16-bit PCM
        audio_data = (audio_data * 32767).astype(np.int16)

        # Create temporary file
        temp_dir = tempfile.gettempdir()
        filename = f'universe_{universe.id}_harmony.wav'
        filepath = os.path.join(temp_dir, filename)

        # Save audio file
        wavfile.write(filepath, sample_rate, audio_data)

        return filepath

    @staticmethod
    def cleanup_export_file(filepath: str) -> None:
        """Clean up exported file."""
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
        except Exception as e:
            print(f"Error cleaning up export file: {e}")
