import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchUniverses } from '../../store/slices/universeSlice';
import CommentList from '../Comments/CommentList';
import MusicControls from '../Music/MusicControls';
import PhysicsControls from '../Physics/PhysicsControls';
import Storyboard from '../Storyboard/Storyboard';
import FavoriteButton from './FavoriteButton';
import PrivacyToggle from './PrivacyToggle';
import ShareUniverse from './ShareUniverse';
import styles from './Universe.module.css';

const UniverseDetail = () => {
  const { universeId } = useParams();
  const dispatch = useDispatch();
  const { currentUniverse, isLoading, error } = useSelector(
    state => state.universe
  );
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (universeId) {
      dispatch(fetchUniverses(universeId));
    }
  }, [dispatch, universeId]);

  if (isLoading) {
    return (
      <div data-testid="loading-indicator" className={styles.loading}>
        Loading universe...
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="error-message" className={styles.error}>
        {error}
      </div>
    );
  }

  if (!currentUniverse) {
    return (
      <div data-testid="not-found-message" className={styles.error}>
        Universe not found
      </div>
    );
  }

  const handleTabChange = tab => {
    setActiveTab(tab);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className={styles.overview} data-testid="overview-content">
            <h2>{currentUniverse.name}</h2>
            <p>{currentUniverse.description}</p>
            <div className={styles.actions}>
              <FavoriteButton universeId={universeId} />
              <PrivacyToggle
                isPrivate={currentUniverse.isPrivate}
                universeId={universeId}
              />
              <ShareUniverse universe={currentUniverse} />
            </div>
          </div>
        );
      case 'physics':
        return (
          <div data-testid="physics-content">
            <PhysicsControls universeId={universeId} />
          </div>
        );
      case 'music':
        return (
          <div data-testid="music-content">
            <MusicControls universeId={universeId} />
          </div>
        );
      case 'storyboard':
        return (
          <div data-testid="storyboard-content">
            <Storyboard universeId={universeId} />
          </div>
        );
      case 'comments':
        return (
          <div data-testid="comments-content">
            <CommentList universeId={universeId} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.universeDetail} data-testid="universe-detail">
      <nav className={styles.tabs} data-testid="universe-tabs">
        <button
          className={`${styles.tab} ${
            activeTab === 'overview' ? styles.active : ''
          }`}
          onClick={() => handleTabChange('overview')}
          data-testid="overview-tab"
        >
          Overview
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === 'physics' ? styles.active : ''
          }`}
          onClick={() => handleTabChange('physics')}
          data-testid="physics-tab"
        >
          Physics
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === 'music' ? styles.active : ''
          }`}
          onClick={() => handleTabChange('music')}
          data-testid="music-tab"
        >
          Music
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === 'storyboard' ? styles.active : ''
          }`}
          onClick={() => handleTabChange('storyboard')}
          data-testid="storyboard-tab"
        >
          Storyboard
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === 'comments' ? styles.active : ''
          }`}
          onClick={() => handleTabChange('comments')}
          data-testid="comments-tab"
        >
          Comments
        </button>
      </nav>
      <div className={styles.content} data-testid="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default UniverseDetail;
