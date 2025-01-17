import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUniverses } from '../../redux/slices/universeSlice';
import CommentList from '../Comments/CommentList';
import MusicControls from '../Music/MusicControls';
import PhysicsControls from '../Physics/PhysicsControls';
import Storyboard from '../Storyboard/Storyboard';
import FavoriteButton from './FavoriteButton';
import PrivacyToggle from './PrivacyToggle';
import ShareUniverse from './ShareUniverse';
import styles from './Universe.module.css';

const UniverseDetail = ({ universeId }) => {
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
    return <div className={styles.loading}>Loading universe...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!currentUniverse) {
    return <div className={styles.error}>Universe not found</div>;
  }

  const handleTabChange = tab => {
    setActiveTab(tab);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className={styles.overview}>
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
        return <PhysicsControls universeId={universeId} />;
      case 'music':
        return <MusicControls universeId={universeId} />;
      case 'storyboard':
        return <Storyboard universeId={universeId} />;
      case 'comments':
        return <CommentList universeId={universeId} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.universeDetail}>
      <nav className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === 'overview' ? styles.active : ''
          }`}
          onClick={() => handleTabChange('overview')}
        >
          Overview
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === 'physics' ? styles.active : ''
          }`}
          onClick={() => handleTabChange('physics')}
        >
          Physics
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === 'music' ? styles.active : ''
          }`}
          onClick={() => handleTabChange('music')}
        >
          Music
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === 'storyboard' ? styles.active : ''
          }`}
          onClick={() => handleTabChange('storyboard')}
        >
          Storyboard
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === 'comments' ? styles.active : ''
          }`}
          onClick={() => handleTabChange('comments')}
        >
          Comments
        </button>
      </nav>
      <div className={styles.content}>{renderTabContent()}</div>
    </div>
  );
};

UniverseDetail.propTypes = {
  universeId: PropTypes.string.isRequired,
};

export default UniverseDetail;
