import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectActiveTrack,
  updateTrackParameters,
} from '../../redux/audioSlice';
import styles from './MusicControls.module.css';

const MusicControls = () => {
  const dispatch = useDispatch();
  const activeTrack = useSelector(selectActiveTrack);

  const handleParameterChange = (parameter, value) => {
    if (activeTrack) {
      dispatch(
        updateTrackParameters({
          trackId: activeTrack.id,
          parameters: {
            [parameter]: parseFloat(value),
          },
        })
      );
    }
  };

  if (!activeTrack) return null;

  const renderParameter = (name, min, max, step) => (
    <div className={styles.controlGroup}>
      <label htmlFor={name}>
        {name.charAt(0).toUpperCase() + name.slice(1)}
      </label>
      <input
        type="range"
        id={name}
        min={min}
        max={max}
        step={step}
        value={activeTrack.parameters[name] || 0.5}
        onChange={e => handleParameterChange(name, e.target.value)}
        aria-label={name}
      />
    </div>
  );

  return (
    <div className={styles.controlsContainer}>
      {renderParameter('harmony', 0, 1, 0.01)}
      {renderParameter('tempo', 40, 200, 1)}
      {renderParameter('key', [
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
      ])}
      {renderParameter('scale', [
        'major',
        'minor',
        'harmonic minor',
        'melodic minor',
        'pentatonic',
        'blues',
      ])}
      {renderParameter('rhythm_complexity', 0, 1, 0.01)}
      {renderParameter('melody_range', 0, 1, 0.01)}
    </div>
  );
};

export default MusicControls;
