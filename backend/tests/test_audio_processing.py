import pytest
import numpy as np
from pathlib import Path
import soundfile as sf
import json

from app.core.audio.processor import AudioProcessor
from app.models.audio_file import AudioFormat


@pytest.fixture
def test_wav_file(tmp_path):
    """Create a test WAV file."""
    file_path = tmp_path / "test.wav"
    sample_rate = 44100
    duration = 1.0  # seconds
    t = np.linspace(0, duration, int(sample_rate * duration))
    audio_data = np.sin(2 * np.pi * 440 * t)  # 440 Hz sine wave
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

    converted_path = processor.convert_format(AudioFormat.MP3, str(output_path))

    assert Path(converted_path).exists()
    assert Path(converted_path).suffix == ".mp3"


def test_apply_effects(test_wav_file):
    """Test applying audio effects."""
    processor = AudioProcessor(str(test_wav_file), AudioFormat.WAV)
    original_data = processor.audio_data.copy()

    # Test normalization
    processor.apply_effects({"normalize": {}})
    assert np.max(np.abs(processor.audio_data)) == pytest.approx(1.0, rel=1e-3)
    assert not np.array_equal(processor.audio_data, original_data)

    # Test pitch shift
    processor = AudioProcessor(str(test_wav_file), AudioFormat.WAV)
    processor.apply_effects({"pitch_shift": {"steps": 2}})
    assert not np.array_equal(processor.audio_data, original_data)

    # Test time stretch
    processor = AudioProcessor(str(test_wav_file), AudioFormat.WAV)
    processor.apply_effects({"time_stretch": {"rate": 2.0}})
    assert len(processor.audio_data) != len(original_data)


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
