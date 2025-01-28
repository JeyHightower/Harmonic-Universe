import React from 'react';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import './AudioControls.css';

const AudioControls = () => {
  const { isPlaying, bpm, startAudio, stopAudio, updateBpm, clearScheduled } =
    useAudioEngine();

  const handlePlayPause = async () => {
    if (isPlaying) {
      stopAudio();
    } else {
      await startAudio();
    }
  };

  const handleBpmChange = e => {
    const newBpm = parseInt(e.target.value, 10);
    if (!isNaN(newBpm) && newBpm >= 40 && newBpm <= 240) {
      updateBpm(newBpm);
    }
  };

  return (
    <div className="audio-controls">
      <button
        className={`play-pause-btn ${isPlaying ? 'playing' : ''}`}
        onClick={handlePlayPause}
      >
        {isPlaying ? 'Stop' : 'Play'}
      </button>

      <div className="bpm-control">
        <label htmlFor="bpm">BPM:</label>
        <input
          type="number"
          id="bpm"
          value={bpm}
          onChange={handleBpmChange}
          min="40"
          max="240"
        />
      </div>

      <button className="clear-btn" onClick={clearScheduled}>
        Clear Notes
      </button>
    </div>
  );
};

export default AudioControls;
