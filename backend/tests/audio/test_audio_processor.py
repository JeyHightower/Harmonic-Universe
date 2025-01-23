import pytest
import numpy as np
from app.services.core.audio_processor import AudioProcessor, PYDUB_AVAILABLE, LIBROSA_AVAILABLE

@pytest.mark.skipif(not LIBROSA_AVAILABLE, reason="librosa not available")
class TestAudioProcessor:
    def setup_method(self):
        """Set up test fixtures."""
        self.processor = AudioProcessor()
        self.duration = 1.0
        self.samples = int(self.processor.sample_rate * self.duration)

    def teardown_method(self):
        """Clean up after tests."""
        self.processor._cache.clear()

    def test_generate_sine_wave(self):
        """Test sine wave generation."""
        frequency = 440  # A4 note
        audio = self.processor.generate_sine_wave(frequency, self.duration)

        assert len(audio) == self.samples
        assert isinstance(audio, np.ndarray)
        assert audio.dtype == np.float32
        assert -1.0 <= audio.max() <= 1.0
        assert -1.0 <= audio.min() <= 1.0

    def test_apply_envelope(self):
        """Test envelope application."""
        audio = np.ones(self.samples)
        envelope = {
            'attack': 0.1,
            'decay': 0.1,
            'sustain': 0.7,
            'release': 0.1
        }

        processed = self.processor.apply_envelope(audio, envelope)

        assert len(processed) == len(audio)
        assert processed[0] == 0  # Start of attack
        assert processed[-1] == 0  # End of release

    def test_apply_effects(self):
        """Test audio effects application."""
        audio = np.random.rand(self.samples)
        effects = {
            'reverb': 0.5,
            'delay': 0.3,
            'filter_cutoff': 1000
        }

        processed = self.processor.apply_effects(audio, effects)

        assert len(processed) == len(audio)
        assert isinstance(processed, np.ndarray)
        assert processed.dtype == np.float32

    def test_normalize_audio(self):
        """Test audio normalization."""
        audio = np.random.rand(self.samples) * 2 - 1  # Random values between -1 and 1
        normalized = self.processor.normalize_audio(audio)

        assert len(normalized) == len(audio)
        assert -1.0 <= normalized.max() <= 1.0
        assert -1.0 <= normalized.min() <= 1.0

@pytest.fixture
def processor():
    proc = AudioProcessor(sample_rate=44100)
    yield proc
    proc._cache.clear()

@pytest.mark.skipif(not LIBROSA_AVAILABLE, reason="librosa not available")
def test_generate_waveform_sine(processor):
    """Test sine waveform generation"""
    duration = 1.0
    frequency = 440
    signal = processor.generate_waveform(frequency, duration, 'sine')
    assert len(signal) == int(processor.sample_rate * duration)
    assert isinstance(signal, np.ndarray)
    assert signal.dtype == np.float32

@pytest.mark.skipif(not LIBROSA_AVAILABLE, reason="librosa not available")
def test_generate_waveform_with_harmonics(processor):
    """Test waveform generation with harmonics"""
    duration = 1.0
    frequency = 440
    harmonics = [1.0, 0.5, 0.25]
    signal = processor.generate_waveform(frequency, duration, 'sine', harmonics)
    assert len(signal) == int(processor.sample_rate * duration)
    assert isinstance(signal, np.ndarray)
    assert signal.dtype == np.float32

@pytest.mark.skipif(not LIBROSA_AVAILABLE, reason="librosa not available")
def test_apply_envelope(processor):
    """Test envelope application"""
    duration = 1.0
    signal = np.random.rand(int(processor.sample_rate * duration))
    envelope = {'attack': 0.1, 'decay': 0.1, 'sustain': 0.7, 'release': 0.1}
    processed = processor.apply_envelope(signal, envelope)
    assert len(processed) == len(signal)
    assert isinstance(processed, np.ndarray)
    assert processed.dtype == np.float32

@pytest.mark.skipif(not LIBROSA_AVAILABLE, reason="librosa not available")
def test_apply_reverb(processor):
    """Test reverb effect"""
    duration = 1.0
    signal = np.random.rand(int(processor.sample_rate * duration))
    processed = processor.apply_reverb(signal, 0.3)
    assert len(processed) == len(signal)
    assert isinstance(processed, np.ndarray)
    assert processed.dtype == np.float32

@pytest.mark.skipif(not LIBROSA_AVAILABLE, reason="librosa not available")
def test_apply_delay(processor):
    """Test delay effect"""
    duration = 1.0
    signal = np.random.rand(int(processor.sample_rate * duration))
    processed = processor.apply_delay(signal, 0.3)
    assert len(processed) == len(signal)
    assert isinstance(processed, np.ndarray)
    assert processed.dtype == np.float32

@pytest.mark.skipif(not LIBROSA_AVAILABLE, reason="librosa not available")
def test_apply_filter(processor):
    """Test filter application"""
    duration = 1.0
    signal = np.random.rand(int(processor.sample_rate * duration))
    processed = processor.apply_filter(signal, 1000)
    assert len(processed) == len(signal)
    assert isinstance(processed, np.ndarray)
    assert processed.dtype == np.float32

@pytest.mark.skipif(not LIBROSA_AVAILABLE, reason="librosa not available")
def test_generate_audio(processor):
    """Test audio generation"""
    duration = 1.0
    parameters = {
        'key': 'A',
        'waveform': 'sine',
        'harmonics': [1.0, 0.5],
        'filter_freq': 1000,
        'reverb': 0.3,
        'delay': 0.2,
        'volume': 0.8
    }
    signal, sample_rate = processor.generate_audio(parameters, duration)
    assert len(signal) == int(processor.sample_rate * duration)
    assert isinstance(signal, np.ndarray)
    assert signal.dtype == np.float32
    assert sample_rate == processor.sample_rate

@pytest.mark.skipif(not LIBROSA_AVAILABLE, reason="librosa not available")
def test_export_audio(processor):
    """Test audio export"""
    duration = 1.0
    signal = np.zeros(int(processor.sample_rate * duration))

    # Test WAV export
    wav_buffer = processor.export_audio(signal, 'wav')
    assert wav_buffer.getvalue()  # Should contain data

    # Test unsupported format
    with pytest.raises(ValueError):
        processor.export_audio(signal, 'unsupported_format')

    # Test MP3 export if pydub is available
    if PYDUB_AVAILABLE:
        mp3_buffer = processor.export_audio(signal, 'mp3')
        assert mp3_buffer.getvalue()  # Should contain data
    else:
        with pytest.raises(ValueError, match="MP3 export requires pydub to be installed"):
            processor.export_audio(signal, 'mp3')

@pytest.mark.skipif(not LIBROSA_AVAILABLE, reason="librosa not available")
def test_audio_caching(processor):
    """Test audio caching"""
    duration = 1.0
    parameters = {
        'key': 'A',
        'waveform': 'sine',
        'harmonics': [1.0]
    }

    # First generation
    signal1, _ = processor.generate_audio(parameters, duration)

    # Second generation (should use cache)
    signal2, _ = processor.generate_audio(parameters, duration)

    assert np.array_equal(signal1, signal2)

@pytest.mark.skipif(not LIBROSA_AVAILABLE, reason="librosa not available")
def test_cache_limit(processor):
    """Test cache size limit"""
    duration = 1.0
    for i in range(10):  # Generate more than cache size
        parameters = {
            'key': f'A{i}',
            'waveform': 'sine',
            'harmonics': [1.0]
        }
        processor.generate_audio(parameters, duration)

    assert len(processor._cache) <= 5  # Default cache size

def test_mp3_export(processor):
    """Test MP3 export functionality"""
    if not LIBROSA_AVAILABLE or not PYDUB_AVAILABLE:
        pytest.skip("librosa or pydub not available")

    # Generate a simple signal
    duration = 1.0
    signal = np.sin(2 * np.pi * 440 * np.linspace(0, duration, int(processor.sample_rate * duration)))

    # Export as MP3
    buffer = processor.export_audio(signal, 'mp3')
    assert buffer.getvalue()  # Should contain data
