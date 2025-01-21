import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addFavorite, removeFavorite } from '../../redux/slices/favoriteSlice';
import styles from './Universe.module.css';

const FavoriteButton = ({ universeId }) => {
  const dispatch = useDispatch();
  const { favorites, isLoading } = useSelector(state => state.favorites);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const isFav = favorites.some(fav => fav.universe_id === universeId);
    setIsFavorited(isFav);
  }, [favorites, universeId]);

  const handleClick = async () => {
    if (isLoading) return;

    try {
      if (isFavorited) {
        await dispatch(removeFavorite(universeId)).unwrap();
      } else {
        await dispatch(addFavorite(universeId)).unwrap();
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  return (
    <button
      className={`${styles.favoriteButton} ${
        isFavorited ? styles.favorited : ''
      } ${isLoading ? styles.loading : ''}`}
      onClick={handleClick}
      disabled={isLoading}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <svg
        viewBox="0 0 24 24"
        fill={isFavorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
      {isLoading && <span className={styles.loadingSpinner} />}
    </button>
  );
};

FavoriteButton.propTypes = {
  universeId: PropTypes.number.isRequired,
};

export default FavoriteButton;
