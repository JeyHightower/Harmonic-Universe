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
    <div className={styles.storyboardList}>
      {storyboards.map(storyboard => (
        <div key={storyboard.id} className={styles.storyboardItem}>
          <h3>{storyboard.title}</h3>
          <p>{storyboard.description}</p>
          <div className={styles.metadata}>
            <span>Created: {new Date(storyboard.createdAt).toLocaleDateString()}</span>
            <span>Updated: {new Date(storyboard.updatedAt).toLocaleDateString()}</span>
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
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      createdAt: PropTypes.string.isRequired,
      updatedAt: PropTypes.string.isRequired
    })
  ).isRequired,
  onStoryboardClick: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

StoryboardList.defaultProps = {
  isLoading: false,
};

export default StoryboardList;
