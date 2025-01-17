import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMusicParameters,
  setParameter,
  updateMusicParameters,
} from '../../redux/slices/musicSlice';
import './MusicControlPanel.css';

const MusicControlPanel = ({ universeId }) => {
  const dispatch = useDispatch();
  const { parameters, status, error } = useSelector(state => state.music);

  useEffect(() => {
    dispatch(fetchMusicParameters(universeId));
  }, [dispatch, universeId]);

  const handleParameterChange = (paramName, value) => {
    dispatch(setParameter({ name: paramName, value }));
    dispatch(
      updateMusicParameters({
        universeId,
        parameters: { ...parameters, [paramName]: value },
      })
    );
  };

  if (status === 'loading') {
    return <div className="music-control-panel loading">Loading...</div>;
  }

  if (status === 'failed') {
    return <div className="music-control-panel error">Error: {error}</div>;
  }

  return (
    <div className="music-control-panel">
      <h2>Music Controls</h2>
      <div className="control-section">
        <div className="parameter-group">
          <h3>Basic Parameters</h3>
          <div className="parameter">
            <label>Tempo</label>
            <input
              type="range"
              min="60"
              max="200"
              value={parameters.tempo}
              onChange={e =>
                handleParameterChange('tempo', parseInt(e.target.value))
              }
            />
            <span>{parameters.tempo} BPM</span>
          </div>
          <div className="parameter">
            <label>Key</label>
            <select
              value={parameters.key}
              onChange={e => handleParameterChange('key', e.target.value)}
            >
              {[
                'C',
                'C#',
                'D',
                'D#',
                'E',
                'F',
                'F#',
                'G',
                'G#',
                'A',
                'A#',
                'B',
              ].map(key => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>
          <div className="parameter">
            <label>Scale</label>
            <select
              value={parameters.scale}
              onChange={e => handleParameterChange('scale', e.target.value)}
            >
              {['major', 'minor', 'pentatonic', 'blues', 'chromatic'].map(
                scale => (
                  <option key={scale} value={scale}>
                    {scale}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        <div className="parameter-group">
          <h3>Effects</h3>
          <div className="parameter">
            <label>Reverb</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={parameters.reverb}
              onChange={e =>
                handleParameterChange('reverb', parseFloat(e.target.value))
              }
            />
            <span>{parameters.reverb.toFixed(2)}</span>
          </div>
          <div className="parameter">
            <label>Delay</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={parameters.delay}
              onChange={e =>
                handleParameterChange('delay', parseFloat(e.target.value))
              }
            />
            <span>{parameters.delay.toFixed(2)}</span>
          </div>
          <div className="parameter">
            <label>Filter Frequency</label>
            <input
              type="range"
              min="20"
              max="20000"
              step="1"
              value={parameters.filterFreq}
              onChange={e =>
                handleParameterChange('filterFreq', parseFloat(e.target.value))
              }
            />
            <span>{parameters.filterFreq} Hz</span>
          </div>
        </div>

        <div className="parameter-group">
          <h3>Waveform</h3>
          <div className="parameter">
            <label>Type</label>
            <select
              value={parameters.waveform}
              onChange={e => handleParameterChange('waveform', e.target.value)}
            >
              {['sine', 'square', 'sawtooth', 'triangle'].map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="parameter">
            <label>Volume</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={parameters.volume}
              onChange={e =>
                handleParameterChange('volume', parseFloat(e.target.value))
              }
            />
            <span>{(parameters.volume * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicControlPanel;
