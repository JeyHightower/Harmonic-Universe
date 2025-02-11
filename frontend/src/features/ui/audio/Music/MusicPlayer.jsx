import PropTypes from "prop-types";
import React, { useCallback, useEffect, useState } from "react";
import AudioEngine from "../../services/audioEngine";
import styles from "./MusicPlayer.module.css";

const MusicPlayer = ({ parameters }) => {
  const [audioEngine] = useState(() => new AudioEngine());
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAudio = async () => {
      try {
        await audioEngine.initialize();
        setIsInitialized(true);
      } catch (err) {
        setError("Failed to initialize audio engine. Please try again.");
      }
    };

    initializeAudio();

    return () => {
      audioEngine.dispose();
    };
  }, [audioEngine]);

  useEffect(() => {
    if (isInitialized && parameters) {
      audioEngine.setParameters(parameters);
    }
  }, [audioEngine, isInitialized, parameters]);

  const handlePlayPause = useCallback(() => {
    if (!isInitialized) return;

    if (isPlaying) {
      audioEngine.stopSequence();
      setIsPlaying(false);
    } else {
      const sequence = audioEngine.generateSequence(parameters);
      audioEngine.startSequence(sequence);
      setIsPlaying(true);
    }
  }, [audioEngine, isInitialized, isPlaying, parameters]);

  const handleExport = useCallback(async () => {
    if (!isPlaying) return;

    try {
      const blob = await audioEngine.exportAudio({
        duration: 10,
        format: "mp3",
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `harmony-${Date.now()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to export audio. Please try again.");
    }
  }, [audioEngine, isPlaying]);

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={() => setError(null)} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.musicPlayer}>
      <div className={styles.controls}>
        <button
          onClick={handlePlayPause}
          className={`${styles.playButton} ${isPlaying ? styles.playing : ""}`}
          disabled={!isInitialized}
        >
          <i className={`fas fa-${isPlaying ? "stop" : "play"}`} />
          {isPlaying ? "Stop" : "Play"}
        </button>

        <button
          onClick={handleExport}
          className={styles.exportButton}
          disabled={!isPlaying}
        >
          <i className="fas fa-download" />
          Export
        </button>
      </div>

      <div className={styles.visualizer}>
        {/* Add audio visualization here */}
      </div>

      <div className={styles.parameters}>
        <div className={styles.parameter}>
          <span>Key:</span>
          <strong>{parameters?.key || "C"}</strong>
        </div>
        <div className={styles.parameter}>
          <span>Scale:</span>
          <strong>{parameters?.scale || "Major"}</strong>
        </div>
        <div className={styles.parameter}>
          <span>Tempo:</span>
          <strong>{parameters?.tempo || 120} BPM</strong>
        </div>
      </div>
    </div>
  );
};

MusicPlayer.propTypes = {
  parameters: PropTypes.shape({
    tempo: PropTypes.number,
    key: PropTypes.string,
    scale: PropTypes.string,
    harmony: PropTypes.number,
    rhythm: PropTypes.number,
    dynamics: PropTypes.number,
  }).isRequired,
};

export default MusicPlayer;
