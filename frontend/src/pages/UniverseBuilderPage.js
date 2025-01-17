// UniverseBuilderPage.js
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import MusicControls from '../components/Music/MusicControls';
import PhysicsControls from '../components/Physics/PhysicsControls';
import { createUniverse } from '../redux/actions/universeActions';
import styles from './UniverseBuilderPage.module.css';

const UniverseBuilderPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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
  });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const result = await dispatch(createUniverse(universeData)).unwrap();
      navigate(`/universe/${result.id}`);
    } catch (error) {
      console.error('Failed to create universe:', error);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formContainer}>
        <h1 className={styles.title}>Create New Universe</h1>
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
              />
            </div>
          </div>

          <div className={styles.parametersSection}>
            <PhysicsControls
              initialValues={universeData.physics_parameters}
              onChange={physics =>
                setUniverseData({
                  ...universeData,
                  physics_parameters: physics,
                })
              }
            />
          </div>

          <div className={styles.parametersSection}>
            <MusicControls
              initialValues={universeData.music_parameters}
              onChange={music =>
                setUniverseData({ ...universeData, music_parameters: music })
              }
            />
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.submitButton}>
              Create Universe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UniverseBuilderPage;
