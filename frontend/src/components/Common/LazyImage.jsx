import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import './LazyImage.css';

const LazyImage = ({ src, alt, placeholder, className, onLoad, onError }) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const img = new Image();
    img.src = src;

    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      if (onLoad) onLoad();
    };

    img.onerror = err => {
      setError(err);
      setIsLoading(false);
      if (onError) onError(err);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, onLoad, onError]);

  return (
    <div className={`lazy-image-container ${className || ''}`}>
      {isLoading && (
        <div className="lazy-image-placeholder">
          <img src={placeholder} alt="Loading..." />
        </div>
      )}
      {error && (
        <div className="lazy-image-error">
          <span>Failed to load image</span>
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`lazy-image ${isLoading ? 'loading' : ''} ${
          error ? 'error' : ''
        }`}
        loading="lazy"
      />
    </div>
  );
};

LazyImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
};

LazyImage.defaultProps = {
  placeholder:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==',
  className: '',
  onLoad: null,
  onError: null,
};

export default React.memo(LazyImage);
