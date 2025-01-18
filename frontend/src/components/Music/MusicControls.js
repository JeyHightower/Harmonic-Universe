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

  return (
    <div className={styles.controlsContainer}>
      <div className={styles.controlGroup}>
        <label htmlFor="rhythmComplexity">Rhythm Complexity</label>
        <input
          type="range"
          id="rhythmComplexity"
          min="0"
          max="1"
          step="0.1"
          value={activeTrack.parameters.rhythmComplexity || 0.5}
          onChange={e =>
            handleParameterChange('rhythmComplexity', e.target.value)
          }
          aria-label="rhythm complexity"
        />
      </div>

      <div className={styles.controlGroup}>
        <label htmlFor="noteDensity">Note Density</label>
        <input
          type="range"
          id="noteDensity"
          min="0"
          max="1"
          step="0.1"
          value={activeTrack.parameters.noteDensity || 0.5}
          onChange={e => handleParameterChange('noteDensity', e.target.value)}
          aria-label="note density"
        />
      </div>
    </div>
  );
};

export default MusicControls;
