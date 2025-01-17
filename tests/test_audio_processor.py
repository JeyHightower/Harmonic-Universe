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
