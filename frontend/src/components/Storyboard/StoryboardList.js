import PropTypes from 'prop-types';
import React from 'react';
import styles from './StoryboardList.module.css';

const StoryboardList = ({ storyboards, onStoryboardClick, isLoading }) => {
  if (!storyboards.length && !isLoading) {
    return (
      <div className={styles.emptyState}>
        <h3>No storyboards found</h3>
        <p>Create a new storyboard to get started</p>
      </div>
    );
  }

  return (
    <div className={styles.storyboardGrid}>
      {storyboards.map(storyboard => (
        <div
          key={storyboard.id}
          className={styles.storyboardCard}
          onClick={() => onStoryboardClick(storyboard)}
        >
          {storyboard.thumbnail ? (
            <img
              src={storyboard.thumbnail}
              alt={storyboard.title}
              className={styles.thumbnail}
            />
          ) : (
            <div className={styles.placeholderThumbnail}>
              <span>No Preview</span>
            </div>
          )}
          <div className={styles.cardContent}>
            <h3>{storyboard.title}</h3>
            <p className={styles.description}>{storyboard.description}</p>
            <div className={styles.metadata}>
              <span className={styles.timestamp}>
                {new Date(storyboard.updatedAt).toLocaleDateString()}
              </span>
              <div className={styles.parameters}>
                <span className={styles.parameter}>
                  <i className="fas fa-music" />
                  {storyboard.musicParameters?.key || 'C'}{' '}
                  {storyboard.musicParameters?.scale || 'Major'}
                </span>
                <span className={styles.parameter}>
                  <i className="fas fa-atom" />
                  G:{' '}
                  {storyboard.physicsParameters?.gravity?.toFixed(1) || '9.8'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
      {isLoading &&
        Array.from({ length: 6 }).map((_, index) => (
          <div key={`skeleton-${index}`} className={styles.skeletonCard}>
            <div className={styles.skeletonThumbnail} />
            <div className={styles.skeletonContent}>
              <div className={styles.skeletonTitle} />
              <div className={styles.skeletonDescription} />
              <div className={styles.skeletonMetadata}>
                <div className={styles.skeletonTimestamp} />
                <div className={styles.skeletonParameters} />
              </div>
            </div>
          </div>
        ))}
    </div>
  );
};

StoryboardList.propTypes = {
  storyboards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      thumbnail: PropTypes.string,
      updatedAt: PropTypes.string.isRequired,
      musicParameters: PropTypes.shape({
        key: PropTypes.string,
        scale: PropTypes.string,
      }),
      physicsParameters: PropTypes.shape({
        gravity: PropTypes.number,
      }),
    })
  ).isRequired,
  onStoryboardClick: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

StoryboardList.defaultProps = {
  isLoading: false,
};

export default StoryboardList;
