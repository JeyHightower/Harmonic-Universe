import PropTypes from 'prop-types';
import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({
  size = 'medium',
  text = 'Loading...',
  fullScreen = false,
}) => {
  const spinnerClasses = `loading-spinner size-${size}${
    fullScreen ? ' fullscreen' : ''
  }`;

  return (
    <div className={spinnerClasses}>
      <div className="spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  text: PropTypes.string,
  fullScreen: PropTypes.bool,
};

export default LoadingSpinner;
