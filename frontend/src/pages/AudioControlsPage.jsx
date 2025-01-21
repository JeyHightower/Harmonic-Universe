import React, { useState } from 'react';
import styles from './AudioControlsPage.module.css';

const AudioControlsPage = () => {
  const [settings, setSettings] = useState({
    harmony: 0.5,
    tempo: 120,
    key: 'C',
    scale: 'major',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);

  const handleParameterChange = async e => {
    const { name, value } = e.target;

    // Validate parameters
    if (name === 'harmony' && (value < 0 || value > 1)) {
      setValidationError('Harmony must be between 0 and 1');
      return;
    }
    if (name === 'tempo' && (value < 60 || value > 200)) {
      setValidationError('Tempo must be between 60 and 200');
      return;
    }

    setValidationError(null);
    setSettings(prev => ({ ...prev, [name]: value }));

    try {
      setIsLoading(true);
      setError(null);

      // Create audio feedback
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 440 * (1 + parseFloat(value));
      gainNode.gain.value = 0.1;

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 100);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      setError('Failed to update audio settings');
    } finally {
      setIsLoading(false);
    }
  };

  const getViewClass = () => {
    if (window.innerWidth <= 375) return styles['mobile-view'];
    return styles['desktop-view'];
  };

  return (
    <div className={`${styles.container} ${getViewClass()}`}>
      <h2>Audio Controls</h2>

      {isLoading && <div data-testid="loading-indicator">Updating...</div>}
      {error && <div data-testid="error-message">{error}</div>}
      {validationError && (
        <div data-testid="validation-error">{validationError}</div>
      )}

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label htmlFor="harmony">Harmony</label>
          <input
            id="harmony"
            name="harmony"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.harmony}
            onChange={handleParameterChange}
            disabled={isLoading}
          />
        </div>

        <div className={styles.controlGroup}>
          <label htmlFor="tempo">Tempo</label>
          <input
            id="tempo"
            name="tempo"
            type="range"
            min="60"
            max="200"
            value={settings.tempo}
            onChange={handleParameterChange}
            disabled={isLoading}
          />
        </div>

        <div className={styles.controlGroup}>
          <label htmlFor="key">Key</label>
          <select
            id="key"
            name="key"
            value={settings.key}
            onChange={handleParameterChange}
            disabled={isLoading}
          >
            <option value="C">C</option>
            <option value="G">G</option>
            <option value="D">D</option>
            <option value="A">A</option>
            <option value="E">E</option>
            <option value="B">B</option>
            <option value="F#">F#</option>
            <option value="C#">C#</option>
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label htmlFor="scale">Scale</label>
          <select
            id="scale"
            name="scale"
            value={settings.scale}
            onChange={handleParameterChange}
            disabled={isLoading}
          >
            <option value="major">Major</option>
            <option value="minor">Minor</option>
          </select>
        </div>
      </div>

      <div className={styles.infoPanel}>
        <h3>About Audio Controls</h3>
        <p>
          Adjust harmony, tempo, key, and scale to customize your audio
          experience.
        </p>
      </div>
    </div>
  );
};

export default AudioControlsPage;
