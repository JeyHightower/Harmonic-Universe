"""
Test audio processing functionality.
"""

import pytest
import numpy as np
from pathlib import Path
import soundfile as sf
import json
import librosa
from sqlalchemy.orm import Session

from backend.app.core.audio.processor import AudioProcessor
from backend.app.models.audio_file import AudioFormat
from backend.app.tests.utils.utils import random_lower_string

@pytest.fixture
def test_wav_file(tmp_path):
    """Create a test WAV file."""
    file_path = tmp_path / "test.wav"
    sample_rate = 44100
    duration = 1.0  # seconds
    t = np.linspace(0, duration, int(sample_rate * duration))
    # Create a non-normalized sine wave (amplitude > 1)
    audio_data = 2.5 * np.sin(2 * np.pi * 440 * t)  # 440 Hz sine wave with amplitude 2.5
    sf.write(file_path, audio_data, sample_rate)
    return file_path

def test_audio_loading(test_wav_file):
    """Test loading audio file."""
    processor = AudioProcessor(str(test_wav_file), AudioFormat.WAV)
    assert processor.audio_data is not None
    assert processor.sample_rate == 44100
    assert len(processor.audio_data) == processor.sample_rate

def test_get_duration(test_wav_file):
    """Test getting audio duration."""
    processor = AudioProcessor(str(test_wav_file), AudioFormat.WAV)
    duration = processor.get_duration()
    assert duration == pytest.approx(1.0, rel=1e-3)

def test_get_waveform_data(test_wav_file):
    """Test generating waveform visualization data."""
    processor = AudioProcessor(str(test_wav_file), AudioFormat.WAV)
    waveform_data = processor.get_waveform_data(num_points=100)

    assert "points" in waveform_data
    assert "sample_rate" in waveform_data
    assert "duration" in waveform_data
    assert len(waveform_data["points"]) == 100
    assert waveform_data["sample_rate"] == 44100
    assert waveform_data["duration"] == pytest.approx(1.0, rel=1e-3)

def test_format_conversion(test_wav_file, tmp_path):
    """Test converting audio format."""
    processor = AudioProcessor(str(test_wav_file), AudioFormat.WAV)
    output_path = tmp_path / "converted.mp3"

    converted_path = processor.convert_format(
        AudioFormat.MP3,
        str(output_path)
    )

    assert Path(converted_path).exists()
    assert Path(converted_path).suffix == ".mp3"

def test_apply_effects(test_wav_file):
    """Test applying audio effects."""
    processor = AudioProcessor(str(test_wav_file), AudioFormat.WAV)
    original_data = processor.audio_data.copy()

    # Test normalization
    # processor.apply_effects({"normalize": {}})
    # assert np.max(np.abs(processor.audio_data)) == pytest.approx(1.0, rel=1e-3)
    # assert not np.array_equal(processor.audio_data, original_data)

    # Test pitch shift
    processor = AudioProcessor(str(test_wav_file), AudioFormat.WAV)
    original_freq = librosa.feature.zero_crossing_rate(processor.audio_data)[0].mean()
    processor.apply_effects({"pitch_shift": {"steps": 2}})
    shifted_freq = librosa.feature.zero_crossing_rate(processor.audio_data)[0].mean()
    assert shifted_freq != pytest.approx(original_freq, rel=1e-3)

    # Test time stretch
    processor = AudioProcessor(str(test_wav_file), AudioFormat.WAV)
    original_length = len(processor.audio_data)
    processor.apply_effects({"time_stretch": {"rate": 2.0}})
    assert len(processor.audio_data) != original_length

def test_save_audio(test_wav_file, tmp_path):
    """Test saving processed audio."""
    processor = AudioProcessor(str(test_wav_file), AudioFormat.WAV)
    processor.apply_effects({"normalize": {}})

    output_path = tmp_path / "processed.wav"
    saved_path = processor.save(str(output_path))

    assert Path(saved_path).exists()
    loaded_data, sr = sf.read(saved_path)
    assert len(loaded_data) == len(processor.audio_data)
    assert sr == processor.sample_rate

def test_to_base64(test_wav_file):
    """Test converting audio to base64."""
    processor = AudioProcessor(str(test_wav_file), AudioFormat.WAV)
    base64_data, mime_type = processor.to_base64()

    assert isinstance(base64_data, str)
    assert mime_type == "audio/wav"
    assert len(base64_data) > 0

def test_load_audio_file(db: Session) -> None:
    """Test loading an audio file."""
    # Create a test audio file
    test_file = Path("test_audio.wav")
    sample_rate = 44100
    duration = 2.0  # seconds
    t = np.linspace(0, duration, int(sample_rate * duration))
    audio_data = np.sin(2 * np.pi * 440 * t)  # 440 Hz sine wave

    processor = AudioProcessor()
    processor.save_audio(test_file, audio_data, sample_rate)

    # Load and verify
    loaded_data, loaded_rate = processor.load_audio(test_file)
    assert loaded_rate == sample_rate
    assert len(loaded_data) == len(audio_data)
    np.testing.assert_array_almost_equal(loaded_data, audio_data)

    # Cleanup
    test_file.unlink()

def test_process_audio(db: Session) -> None:
    """Test audio processing functions."""
    # Create test audio data
    sample_rate = 44100
    duration = 1.0
    t = np.linspace(0, duration, int(sample_rate * duration))
    audio_data = np.sin(2 * np.pi * 440 * t)

    processor = AudioProcessor()

    # Test normalization
    normalized = processor.normalize(audio_data)
    assert np.max(np.abs(normalized)) <= 1.0

    # Test resampling
    new_rate = 22050
    resampled = processor.resample(audio_data, sample_rate, new_rate)
    assert len(resampled) == int(len(audio_data) * new_rate / sample_rate)

    # Test filtering
    filtered = processor.apply_filter(audio_data, sample_rate, cutoff=1000, filter_type="lowpass")
    assert len(filtered) == len(audio_data)

def test_audio_analysis(db: Session) -> None:
    """Test audio analysis functions."""
    # Create test audio data
    sample_rate = 44100
    duration = 1.0
    t = np.linspace(0, duration, int(sample_rate * duration))
    frequency = 440  # Hz
    audio_data = np.sin(2 * np.pi * frequency * t)

    processor = AudioProcessor()

    # Test frequency analysis
    frequencies, magnitudes = processor.analyze_frequency_content(audio_data, sample_rate)
    peak_freq_idx = np.argmax(magnitudes)
    assert abs(frequencies[peak_freq_idx] - frequency) < 1.0  # Allow 1 Hz tolerance

    # Test envelope detection
    envelope = processor.detect_envelope(audio_data)
    assert len(envelope) == len(audio_data)
    assert np.all(envelope >= 0)  # Envelope should be non-negative

    # Test onset detection
    onsets = processor.detect_onsets(audio_data, sample_rate)
    assert isinstance(onsets, np.ndarray)
    assert np.all(onsets >= 0)  # Onset times should be non-negative

def test_audio_effects(db: Session) -> None:
    """Test audio effects processing."""
    # Create test audio data
    sample_rate = 44100
    duration = 1.0
    t = np.linspace(0, duration, int(sample_rate * duration))
    audio_data = np.sin(2 * np.pi * 440 * t)

    processor = AudioProcessor()

    # Test reverb
    reverb_audio = processor.apply_reverb(audio_data, sample_rate)
    assert len(reverb_audio) >= len(audio_data)  # Reverb should add some length

    # Test delay
    delay_time = 0.1  # seconds
    delay_audio = processor.apply_delay(audio_data, sample_rate, delay_time)
    assert len(delay_audio) > len(audio_data)  # Delay should add length

    # Test distortion
    gain = 2.0
    distorted = processor.apply_distortion(audio_data, gain)
    assert len(distorted) == len(audio_data)
    assert np.max(np.abs(distorted)) <= 1.0  # Should be normalized
