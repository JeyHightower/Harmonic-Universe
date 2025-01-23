import React, { useEffect, useState } from 'react';
import { audioService } from '../../services/audioService';

const AudioSettings = ({ universeId }) => {
  const [settings, setSettings] = useState({
    masterVolume: 0.8,
    effectsVolume: 0.6,
    reverbAmount: 0.3,
    delayTime: 0.4,
    compression: {
      threshold: -24,
      ratio: 4,
      attack: 0.003,
      release: 0.25,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (universeId) {
      loadSettings();
    } else {
      setLoading(false);
    }
  }, [universeId]);

  const loadSettings = async () => {
    try {
      const response = await audioService.getAudioSettings(universeId);
      setSettings(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: parseFloat(value),
        },
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: parseFloat(value),
      }));
    }
  };

  const validateVolume = value => {
    return value >= 0 && value <= 1;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateVolume(settings.masterVolume)) {
      setError('Volume must be between 0 and 1');
      return;
    }
    try {
      await audioService.updateAudioSettings(settings);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReset = async () => {
    if (!universeId) return;
    try {
      await audioService.deleteSettings(universeId);
      setSettings({
        masterVolume: 0.8,
        effectsVolume: 0.6,
        reverbAmount: 0.3,
        delayTime: 0.4,
        compression: {
          threshold: -24,
          ratio: 4,
          attack: 0.003,
          release: 0.25,
        },
      });
      setShowConfirmation(false);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePreview = async () => {
    if (!universeId) return;
    try {
      const response = await audioService.previewAudio(universeId);
      setPreviewUrl(response.data.url);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div data-testid="loading-indicator">Loading...</div>;
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="masterVolume">Master Volume</label>
          <input
            id="masterVolume"
            name="masterVolume"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.masterVolume}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="effectsVolume">Effects Volume</label>
          <input
            id="effectsVolume"
            name="effectsVolume"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.effectsVolume}
            onChange={handleChange}
          />
        </div>

        {error && <div className="error">{error}</div>}

        <button type="submit">Save</button>
        <button type="button" onClick={() => setShowConfirmation(true)}>
          Reset
        </button>
        <button type="button" onClick={handlePreview}>
          Preview
        </button>
      </form>

      {showConfirmation && (
        <div className="confirmation-dialog">
          <p>Are you sure you want to reset all settings?</p>
          <button onClick={handleReset}>Confirm</button>
          <button onClick={() => setShowConfirmation(false)}>Cancel</button>
        </div>
      )}

      {previewUrl && (
        <audio data-testid="audio-player" controls src={previewUrl}>
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
};

export default AudioSettings;
