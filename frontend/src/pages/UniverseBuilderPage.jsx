// UniverseBuilderPage.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import MusicControlPanel from '../../components/MusicControls/MusicControlPanel';
import PhysicsControlPanel from '../../components/PhysicsControls/PhysicsControlPanel';
import VisualizationControlPanel from '../../components/VisualizationControls/VisualizationControlPanel';
import {
  createUniverse,
  resetStatus,
  selectUniverseError,
  selectUniverseStatus,
} from '../../store/slices/universeSlice';
import styles from './UniverseBuilderPage.module.css';

const UniverseBuilderPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector(selectUniverseStatus);
  const error = useSelector(selectUniverseError);

  const [universeData, setUniverseData] = useState({
    name: '',
    description: '',
    physics_parameters: {
      gravity: 9.81,
      friction: 0.5,
      elasticity: 0.7,
      airResistance: 0.1,
      density: 1.0,
    },
    music_parameters: {
      harmony: 1.0,
      tempo: 120,
      key: 'C',
      scale: 'major',
    },
    visualization_parameters: {
      brightness: 0.8,
      saturation: 0.7,
      complexity: 0.5,
      colorScheme: 'rainbow',
    },
  });

  useEffect(() => {
    // Reset status when component unmounts
    return () => {
      dispatch(resetStatus());
    };
  }, [dispatch]);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const result = await dispatch(createUniverse(universeData)).unwrap();
      navigate(`/universe/${result.id}`);
    } catch (error) {
      // Error is handled by the redux slice
      console.error('Failed to create universe:', error);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formContainer}>
        <h1 className={styles.title}>Create New Universe</h1>
        {error && <div className={styles.error}>{error.message}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.basicInfo}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Universe Name</label>
              <input
                id="name"
                type="text"
                value={universeData.name}
                onChange={e =>
                  setUniverseData({ ...universeData, name: e.target.value })
                }
                placeholder="Enter universe name"
                required
                className={styles.input}
                disabled={status === 'loading'}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={universeData.description}
                onChange={e =>
                  setUniverseData({
                    ...universeData,
                    description: e.target.value,
                  })
                }
                placeholder="Describe your universe"
                className={styles.textarea}
                rows={4}
                disabled={status === 'loading'}
              />
            </div>
          </div>

          <div className={styles.controlPanelsContainer}>
            <div className={styles.controlPanel}>
              <PhysicsControlPanel
                initialValues={universeData.physics_parameters}
                onChange={physics =>
                  setUniverseData({
                    ...universeData,
                    physics_parameters: physics,
                  })
                }
              />
            </div>

            <div className={styles.controlPanel}>
              <MusicControlPanel
                initialValues={universeData.music_parameters}
                onChange={music =>
                  setUniverseData({ ...universeData, music_parameters: music })
                }
              />
            </div>

            <div className={styles.controlPanel}>
              <VisualizationControlPanel
                initialValues={universeData.visualization_parameters}
                onChange={visualization =>
                  setUniverseData({
                    ...universeData,
                    visualization_parameters: visualization,
                  })
                }
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="submit"
              className={`${styles.submitButton} ${
                status === 'loading' ? styles.loading : ''
              }`}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Creating...' : 'Create Universe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UniverseBuilderPage;
