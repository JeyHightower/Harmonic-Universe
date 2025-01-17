import pytest
import numpy as np
from app.services.audio_processor import AudioProcessor

@pytest.fixture
def processor():
    return AudioProcessor(sample_rate=44100)

def test_generate_waveform_sine(processor):
    """Test sine wave generation"""
    duration = 1.0
    frequency = 440.0  # A4 note
    signal = processor.generate_waveform(frequency, duration, 'sine')

    # Check signal properties
    assert len(signal) == int(processor.sample_rate * duration)
    assert -1.0 <= signal.min() <= 1.0
    assert -1.0 <= signal.max() <= 1.0

def test_generate_waveform_with_harmonics(processor):
    """Test waveform generation with harmonics"""
    duration = 1.0
    frequency = 440.0
    harmonics = [1.0, 0.5, 0.25]  # Fundamental + 2 harmonics
    signal = processor.generate_waveform(frequency, duration, 'sine', harmonics)

    assert len(signal) == int(processor.sample_rate * duration)
    assert -1.0 <= signal.min() <= 1.0
    assert -1.0 <= signal.max() <= 1.0

def test_apply_envelope(processor):
    """Test ADSR envelope application"""
    duration = 1.0
    signal = np.ones(int(processor.sample_rate * duration))

    enveloped = processor.apply_envelope(signal,
                                       attack=0.1,
                                       decay=0.1,
                                       sustain=0.7,
                                       release=0.2)

    # Check envelope shape
    assert enveloped[0] == 0  # Start at zero
    assert enveloped[-1] == 0  # End at zero
    assert len(enveloped) == len(signal)

def test_apply_reverb(processor):
    """Test reverb effect"""
    duration = 1.0
    signal = np.ones(int(processor.sample_rate * duration))

    reverbed = processor.apply_reverb(signal, amount=0.3)

    assert len(reverbed) == len(signal)
    assert not np.array_equal(reverbed, signal)  # Should be different from input

def test_apply_delay(processor):
    """Test delay effect"""
    duration = 1.0
    signal = np.ones(int(processor.sample_rate * duration))

    delayed = processor.apply_delay(signal, delay_time=0.1, feedback=0.3)

    assert len(delayed) == len(signal)
    assert not np.array_equal(delayed, signal)

def test_apply_filter(processor):
    """Test filter application"""
    duration = 1.0
    signal = np.ones(int(processor.sample_rate * duration))

    filtered = processor.apply_filter(signal,
                                    cutoff_freq=1000.0,
                                    resonance=1.0,
                                    filter_type='lowpass')

    assert len(filtered) == len(signal)

def test_generate_audio(processor):
    """Test complete audio generation"""
    parameters = {
        'key': 'A',
        'waveform': 'sine',
        'harmonics': [1.0, 0.5],
        'volume': 0.8,
        'reverb': 0.3,
        'delay': 0.1,
        'filter_freq': 2000.0,
        'filter_resonance': 1.0
    }

    duration = 2.0
    signal, sample_rate = processor.generate_audio(parameters, duration)

    assert len(signal) == int(processor.sample_rate * duration)
    assert sample_rate == processor.sample_rate
    assert -1.0 <= signal.min() <= 1.0
    assert -1.0 <= signal.max() <= 1.0

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

    # Test MP3 export
    mp3_buffer = processor.export_audio(signal, 'mp3')
    assert mp3_buffer.getvalue()  # Should contain data
    assert mp3_buffer.getvalue()[:3] == b'ID3'  # Check for MP3 magic number

def test_audio_caching(processor):
    """Test audio caching functionality"""
    parameters = {
        'key': 'A',
        'waveform': 'sine',
        'harmonics': [1.0, 0.5],
        'volume': 0.8,
        'reverb': 0.3,
        'delay': 0.1,
        'filter_freq': 2000.0,
        'filter_resonance': 1.0
    }
    duration = 1.0

    # First call should generate new audio
    signal1, sr1 = processor.generate_audio_cached(parameters, duration)

    # Second call with same parameters should return cached result
    signal2, sr2 = processor.generate_audio_cached(parameters, duration)

    # Results should be identical
    assert np.array_equal(signal1, signal2)
    assert sr1 == sr2

    # Modify parameters
    parameters['volume'] = 0.5

    # Call with different parameters should generate new audio
    signal3, sr3 = processor.generate_audio_cached(parameters, duration)

    # Results should be different
    assert not np.array_equal(signal1, signal3)
    assert sr1 == sr3  # Sample rate should still be the same

def test_cache_limit(processor):
    """Test cache size limiting"""
    # Fill cache with 101 different items
    for i in range(101):
        parameters = {
            'key': 'A',
            'waveform': 'sine',
            'volume': i / 100,  # Different volume for each item
        }
        processor.generate_audio_cached(parameters, 1.0)

    # Cache should be limited to 100 items
    assert len(processor._cache) == 100

def test_mp3_export(processor):
    """Test MP3 export functionality"""
    # Generate a simple signal
    duration = 1.0
    signal = np.sin(2 * np.pi * 440 * np.linspace(0, duration, int(processor.sample_rate * duration)))

    # Export as MP3
    buffer = processor.export_audio(signal, 'mp3')

    # Check that we got some data
    assert buffer.getvalue()

    # Check that it starts with MP3 magic number (ID3 or MPEG sync)
    magic = buffer.getvalue()[:3]
    assert magic in (b'ID3', b'\xff\xfb\x90')  # ID3v2 tag or MPEG sync word
