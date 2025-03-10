"""Audio processing tasks."""

from backend.app.celery import celery
from backend.app.models.core.universe import Universe
from backend.app.models.audio import AudioFile, AudioTrack
from backend.app.db.session import get_db
import librosa
import numpy as np
import soundfile as sf
import os
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

@celery.task
def process_audio_file(file_path: str, universe_id: int) -> Dict[str, Any]:
    """Process an audio file and extract its features."""
    try:
        # Load the audio file
        y, sr = librosa.load(file_path, sr=None)

        # Extract features
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        mfcc = librosa.feature.mfcc(y=y, sr=sr)
        spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)

        # Calculate average features
        features = {
            'tempo': float(tempo),
            'chroma_mean': float(np.mean(chroma)),
            'mfcc_mean': float(np.mean(mfcc)),
            'spectral_centroid_mean': float(np.mean(spectral_centroid))
        }

        # Save features to database
        with get_db() as db:
            audio_file = AudioFile(
                path=file_path,
                universe_id=universe_id,
                features=features
            )
            db.add(audio_file)
            db.commit()

        return {
            'status': 'success',
            'features': features,
            'audio_file_id': audio_file.id
        }

    except Exception as e:
        logger.error(f"Error processing audio file: {str(e)}")
        return {
            'status': 'error',
            'error': str(e)
        }

@celery.task
def generate_audio_track(universe_id: int, parameters: Dict[str, Any]) -> Dict[str, Any]:
    """Generate an audio track based on universe parameters."""
    try:
        with get_db() as db:
            from backend.app.db.repositories.universe import UniverseRepository
            universe_repo = UniverseRepository(db)
            universe = universe_repo.get_universe_by_id(str(universe_id))
            if not universe:
                raise ValueError(f"Universe {universe_id} not found")

            # Generate audio based on parameters
            duration = parameters.get('duration', 30)  # seconds
            sr = parameters.get('sample_rate', 44100)

            # Example: Generate a simple sine wave
            t = np.linspace(0, duration, int(sr * duration))
            frequency = parameters.get('frequency', 440)  # Hz
            amplitude = parameters.get('amplitude', 0.5)
            y = amplitude * np.sin(2 * np.pi * frequency * t)

            # Apply effects based on universe parameters
            if universe.physics_params.get('gravity'):
                # Example: Use gravity to affect amplitude
                gravity = universe.physics_params['gravity']['value']
                y *= (gravity / 9.81)

            # Save the generated audio
            output_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                'uploads',
                'audio',
                f'generated_{universe_id}_{int(frequency)}hz.wav'
            )
            sf.write(output_path, y, sr)

            # Create audio track record
            track = AudioTrack(
                universe_id=universe_id,
                path=output_path,
                parameters=parameters
            )
            db.add(track)
            db.commit()

            return {
                'status': 'success',
                'track_id': track.id,
                'path': output_path
            }

    except Exception as e:
        logger.error(f"Error generating audio track: {str(e)}")
        return {
            'status': 'error',
            'error': str(e)
        }
