import React, { useEffect, useState } from 'react';
import { musicService } from '../../services/musicService';

const MusicParameters = ({ universeId }) => {
  const [parameters, setParameters] = useState({
    tempo: 120,
    key: 'C',
    scale: 'major',
    harmony: 0.5,
    volume: 0.8,
    reverb: 0.3,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (universeId) {
      loadParameters();
    } else {
      setLoading(false);
    }
  }, [universeId]);

  const loadParameters = async () => {
    try {
      const response = await musicService.getMusicParameters(universeId);
      setParameters(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setParameters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await musicService.updateMusicParameters(parameters);
      setError(null);
    } catch (err) {
      setError(err.message || 'Creation failed');
    }
  };

  const handleReset = async () => {
    if (!universeId) return;
    try {
      await musicService.deleteSettings(universeId);
      setParameters({
        tempo: 120,
        key: 'C',
        scale: 'major',
        harmony: 0.5,
        volume: 0.8,
        reverb: 0.3,
      });
      setShowConfirmation(false);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGenerate = async () => {
    if (!universeId) return;
    try {
      const response = await musicService.generateAIMusic(
        universeId,
        parameters
      );
      setParameters(response.data.parameters);
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
          <label htmlFor="tempo">Tempo</label>
          <input
            id="tempo"
            name="tempo"
            type="number"
            value={parameters.tempo}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="key">Key</label>
          <input
            id="key"
            name="key"
            type="text"
            value={parameters.key}
            onChange={handleChange}
          />
        </div>

        {error && <div className="error">{error}</div>}

        <button type="submit">Save</button>
        <button type="button" onClick={() => setShowConfirmation(true)}>
          Reset
        </button>
        <button type="button" onClick={handleGenerate}>
          Generate
        </button>
      </form>

      {showConfirmation && (
        <div className="confirmation-dialog">
          <p>Are you sure you want to reset all parameters?</p>
          <button onClick={handleReset}>Confirm</button>
          <button onClick={() => setShowConfirmation(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default MusicParameters;
