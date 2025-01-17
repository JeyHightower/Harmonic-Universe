import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateMusicParameters } from '../../redux/slices/musicSlice';
import AudioEngine from '../../services/audioEngine';
import AudioExport from '../Audio/AudioExport';
import HarmonicsEditor from '../Audio/HarmonicsEditor';
import PresetBank from '../Audio/PresetBank';
import WaveformSelector from '../Audio/WaveformSelector';
import styles from './MusicControls.module.css';

const MusicControls = ({ universeId }) => {
  const dispatch = useDispatch();
  const { parameters, isLoading, error } = useSelector(state => state.music);
  const [audioEngine] = useState(() => new AudioEngine());
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize audio engine
  useEffect(() => {
    audioEngine.initialize();
    return () => audioEngine.dispose();
  }, [audioEngine]);

  // Update audio parameters when they change
  useEffect(() => {
    if (!parameters) return;

    audioEngine.setWaveform(parameters.waveform);
    audioEngine.setHarmonics(parameters.harmonics);
    audioEngine.setVolume(parameters.volume);
  }, [audioEngine, parameters]);

  const handleWaveformChange = useCallback(
    waveform => {
      dispatch(
        updateMusicParameters({
          universeId,
          parameters: { ...parameters, waveform },
        })
      );
    },
    [dispatch, universeId, parameters]
  );

  const handleHarmonicsChange = useCallback(
    harmonics => {
      dispatch(
        updateMusicParameters({
          universeId,
          parameters: { ...parameters, harmonics },
        })
      );
    },
    [dispatch, universeId, parameters]
  );

  const handleVolumeChange = useCallback(
    e => {
      const volume = parseFloat(e.target.value);
      dispatch(
        updateMusicParameters({
          universeId,
          parameters: { ...parameters, volume },
        })
      );
    },
    [dispatch, universeId, parameters]
  );

  const handlePresetSelect = useCallback(
    preset => {
      dispatch(
        updateMusicParameters({
          universeId,
          parameters: {
            ...parameters,
            waveform: preset.waveform,
            harmonics: preset.harmonics,
          },
        })
      );
    },
    [dispatch, universeId, parameters]
  );

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      audioEngine.stopSequence();
      setIsPlaying(false);
    } else {
      // Example sequence - this should be based on your harmony generation logic
      const sequence = ['C4', 'E4', 'G4', 'B4'];
      audioEngine.startSequence(sequence);
      setIsPlaying(true);
    }
  }, [audioEngine, isPlaying]);

  const handleExport = useCallback(
    async ({ format, duration }) => {
      try {
        const blob = await audioEngine.exportAudio({ format, duration });
        if (!blob) return;

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `harmony-${universeId}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Export failed:', error);
      }
    },
    [audioEngine, universeId]
  );

  if (isLoading) {
    return <div className={styles.loading}>Loading music controls...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!parameters) {
    return <div className={styles.error}>No music parameters found</div>;
  }

  return (
    <div className={styles.musicControls}>
      <div className={styles.mainControls}>
        <button
          onClick={handlePlayPause}
          className={`${styles.playButton} ${isPlaying ? styles.playing : ''}`}
        >
          {isPlaying ? 'Stop' : 'Play'}
        </button>
        <div className={styles.volumeControl}>
          <label htmlFor="volume">Volume (dB)</label>
          <input
            id="volume"
            type="range"
            min="-60"
            max="0"
            step="1"
            value={parameters.volume}
            onChange={handleVolumeChange}
            className={styles.volumeSlider}
          />
          <span className={styles.volumeValue}>{parameters.volume} dB</span>
        </div>
      </div>

      <WaveformSelector
        value={parameters.waveform}
        onChange={handleWaveformChange}
        disabled={isPlaying}
      />

      <HarmonicsEditor
        harmonics={parameters.harmonics}
        onChange={handleHarmonicsChange}
        disabled={isPlaying}
      />

      <PresetBank
        onPresetSelect={handlePresetSelect}
        currentWaveform={parameters.waveform}
        currentHarmonics={parameters.harmonics}
        disabled={isPlaying}
      />

      <AudioExport onExport={handleExport} disabled={!isPlaying} />
    </div>
  );
};

MusicControls.propTypes = {
  universeId: PropTypes.string.isRequired,
};

export default MusicControls;
