import PropTypes from 'prop-types';
import React from 'react';
import styles from './Universe.module.css';

const UniverseOverview = ({ universe }) => {
  if (!universe) return null;

  return (
    <div className={styles.overview} data-testid="universe-overview">
      <p className={styles.description} data-testid="universe-description">
        {universe.description}
      </p>
      <div className={styles.stats} data-testid="universe-stats">
        <div className={styles.stat} data-testid="gravity-stat">
          <label>Gravity Constant:</label>
          <span>{universe.gravity_constant}</span>
        </div>
        <div className={styles.stat} data-testid="harmony-stat">
          <label>Environment Harmony:</label>
          <span>{universe.environment_harmony}</span>
        </div>
        <div className={styles.stat} data-testid="created-stat">
          <label>Created:</label>
          <span>{new Date(universe.created_at).toLocaleDateString()}</span>
        </div>
        <div className={styles.stat} data-testid="updated-stat">
          <label>Last Updated:</label>
          <span>{new Date(universe.updated_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

UniverseOverview.propTypes = {
  universe: PropTypes.shape({
    description: PropTypes.string,
    gravity_constant: PropTypes.number,
    environment_harmony: PropTypes.number,
    created_at: PropTypes.string,
    updated_at: PropTypes.string,
  }),
};

export default UniverseOverview;
