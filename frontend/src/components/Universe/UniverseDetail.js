import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUniverseDetail } from '../../redux/slices/universeSlice';
import styles from './Universe.module.css';
import ErrorBoundary from '../Common/ErrorBoundary';

const UniverseDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentUniverse, isLoading, error } = useSelector((state) => state.universe);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    dispatch(fetchUniverseDetail(id));
  }, [dispatch, id]);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading universe details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h3>Error Loading Universe</h3>
        <p>{error}</p>
        <button
          onClick={() => dispatch(fetchUniverseDetail(id))}
          className={styles.retryButton}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!currentUniverse) {
    return (
      <div className={styles.notFound}>
        <h3>Universe Not Found</h3>
        <p>The universe you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={styles.universeDetail}>
        <h2 className={styles.title}>{currentUniverse.name}</h2>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'physics' ? styles.active : ''}`}
            onClick={() => setActiveTab('physics')}
          >
            Physics Parameters
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'music' ? styles.active : ''}`}
            onClick={() => setActiveTab('music')}
          >
            Music Parameters
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'storyboard' ? styles.active : ''}`}
            onClick={() => setActiveTab('storyboard')}
          >
            Storyboard
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'overview' && (
            <div className={styles.overview}>
              <p className={styles.description}>{currentUniverse.description}</p>
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <label>Gravity Constant:</label>
                  <span>{currentUniverse.gravityConstant}</span>
                </div>
                <div className={styles.stat}>
                  <label>Environment Harmony:</label>
                  <span>{currentUniverse.environmentHarmony}</span>
                </div>
              </div>
            </div>
          )}
          {/* Add other tab contents similarly */}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default UniverseDetail;
