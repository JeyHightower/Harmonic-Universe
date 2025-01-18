import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import AudioController from '../components/Audio/AudioController';
import AudioVisualizer from '../components/Audio/AudioVisualizer';
import FrequencyAnalyzer from '../components/Audio/FrequencyAnalyzer';
import ErrorMessage from '../components/Common/ErrorMessage';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import {
  fetchMusicParameters,
  updateMusicParameters,
} from '../store/actions/musicActions';
import './MusicParametersPage.css';

const MusicParametersPage = () => {
  const { universeId } = useParams();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const musicParameters = useSelector(state => state.music.parameters);
  const universe = useSelector(state => state.universes.currentUniverse);

  useEffect(() => {
    const loadParameters = async () => {
      try {
        await dispatch(fetchMusicParameters(universeId));
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load music parameters');
        setIsLoading(false);
      }
    };

    loadParameters();
  }, [dispatch, universeId]);

  const handleParameterChange = async (parameter, value) => {
    try {
      await dispatch(updateMusicParameters(universeId, { [parameter]: value }));
    } catch (err) {
      setError('Failed to update music parameters');
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading music parameters..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="music-parameters-page">
      <header className="music-parameters-header">
        <h1>{universe?.name} - Music Parameters</h1>
        <p className="music-description">
          Fine-tune the musical elements of your universe to create the perfect
          harmony.
        </p>
      </header>

      <div className="music-content">
        <div className="visualization-container">
          <div className="waveform-section">
            <h2>Waveform</h2>
            <AudioVisualizer
              parameters={musicParameters}
              universeId={universeId}
            />
          </div>

          <div className="frequency-section">
            <h2>Frequency Spectrum</h2>
            <FrequencyAnalyzer
              parameters={musicParameters}
              universeId={universeId}
            />
          </div>
        </div>

        <div className="controls-container">
          <h2>Audio Controls</h2>
          <AudioController
            parameters={musicParameters}
            onParameterChange={handleParameterChange}
          />
        </div>
      </div>

      <div className="music-info">
        <h3>About Music Parameters</h3>
        <p>
          The music parameters shape the sonic characteristics of your universe:
        </p>
        <ul>
          <li>
            <strong>Tempo:</strong> Controls the speed of the music
          </li>
          <li>
            <strong>Key:</strong> Sets the musical key and scale
          </li>
          <li>
            <strong>Harmony:</strong> Adjusts harmonic relationships
          </li>
          <li>
            <strong>Timbre:</strong> Shapes the tonal quality
          </li>
          <li>
            <strong>Dynamics:</strong> Controls volume and expression
          </li>
        </ul>
      </div>
    </div>
  );
};

export default MusicParametersPage;
