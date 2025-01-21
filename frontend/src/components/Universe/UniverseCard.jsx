import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import styles from './UniverseCard.module.css';

const UniverseCard = React.memo(({ universe, onDelete }) => {
  const formattedDate = useMemo(() => {
    return new Date(universe.created_at).toLocaleDateString();
  }, [universe.created_at]);

  const handleDelete = e => {
    e.preventDefault();
    onDelete(universe.id);
  };

  const cardStyle = useMemo(
    () => ({
      background: `linear-gradient(45deg, ${
        universe.color_scheme || '#4a90e2'
      }, ${universe.secondary_color || '#357abd'})`,
    }),
    [universe.color_scheme, universe.secondary_color]
  );

  return (
    <Link
      to={`/universe/${universe.id}`}
      className={styles.card}
      style={cardStyle}
    >
      <div className={styles.content}>
        <h3 className={styles.title}>{universe.name}</h3>
        <p className={styles.description}>{universe.description}</p>
        <div className={styles.metadata}>
          <span className={styles.date}>Created: {formattedDate}</span>
          <span className={styles.author}>By: {universe.author}</span>
        </div>
        {onDelete && (
          <button
            className={styles.deleteButton}
            onClick={handleDelete}
            aria-label="Delete universe"
          >
            Delete
          </button>
        )}
      </div>
    </Link>
  );
});

UniverseCard.displayName = 'UniverseCard';

export default UniverseCard;
