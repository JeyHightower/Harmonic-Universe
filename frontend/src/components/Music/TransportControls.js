import React from 'react';
import { useSelector } from 'react-redux';
import useAudioEngine from '../../hooks/useAudioEngine';
import { selectError, selectIsPlaying } from '../../store/slices/audioSlice';
import styles from './TransportControls.module.css';

const TransportControls = () => {
  const isPlaying = useSelector(selectIsPlaying);
  const error = useSelector(selectError);
  const { generateSequence, startPlayback, stopPlayback, exportAudio } =
    useAudioEngine();

  const handlePlayPause = async () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      await startPlayback();
    }
  };

  const handleGenerate = async () => {
    if (isPlaying) {
      stopPlayback();
    }
    await generateSequence();
  };

  const handleExport = async () => {
    const buffer = await exportAudio(4); // Export 4 seconds of audio
    if (buffer) {
      // Create a WAV file from the buffer
      const wav = new Blob([buffer.get()], { type: 'audio/wav' });
      const url = URL.createObjectURL(wav);

      // Create a download link
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sequence.wav';
      a.click();

      // Clean up
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className={styles.controls}>
      <div className={styles.mainControls}>
        <button
          className={`${styles.button} ${styles.generate}`}
          onClick={handleGenerate}
          title="Generate new sequence"
        >
          <i className="fas fa-random" />
          <span>Generate</span>
        </button>

        <button
          className={`${styles.button} ${styles.playPause}`}
          onClick={handlePlayPause}
          title={isPlaying ? 'Stop' : 'Play'}
        >
          <i className={`fas fa-${isPlaying ? 'stop' : 'play'}`} />
          <span>{isPlaying ? 'Stop' : 'Play'}</span>
        </button>

        <button
          className={`${styles.button} ${styles.export}`}
          onClick={handleExport}
          title="Export as WAV"
          disabled={!isPlaying}
        >
          <i className="fas fa-download" />
          <span>Export</span>
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          <i className="fas fa-exclamation-triangle" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default TransportControls;
