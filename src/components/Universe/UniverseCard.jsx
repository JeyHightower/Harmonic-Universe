import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import FavoriteButton from './FavoriteButton';
import styles from './Universe.module.css';

const UniverseCard = ({ universe }) => {
  return (
    <div className={styles.card} data-testid="universe-card">
      <div className={styles.cardHeader}>
        <Link to={`/universe/${universe.id}`} className={styles.title}>
          {universe.name}
        </Link>
        <FavoriteButton universeId={universe.id} />
      </div>
      <p className={styles.description}>{universe.description}</p>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <label>Gravity:</label>
          <span>{universe.gravity_constant}</span>
        </div>
        <div className={styles.stat}>
          <label>Harmony:</label>
          <span>{universe.environment_harmony}</span>
        </div>
      </div>
      <div className={styles.meta}>
        <span className={styles.date}>
          Created: {new Date(universe.created_at).toLocaleDateString()}
        </span>
        {universe.favorite_count > 0 && (
          <span className={styles.favorites}>♥ {universe.favorite_count}</span>
        )}
      </div>
    </div>
  );
};

UniverseCard.propTypes = {
  universe: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    gravity_constant: PropTypes.number,
    environment_harmony: PropTypes.number,
    created_at: PropTypes.string,
    favorite_count: PropTypes.number,
  }).isRequired,
};

export default UniverseCard;
