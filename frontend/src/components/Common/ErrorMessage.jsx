import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({
  message,
  details,
  category,
  duration = 5000,
  onDismiss,
  showIcon = true,
  variant = 'default',
  severity = 'error', // error, warning, info
}) => {
  useEffect(() => {
    if (duration && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  const getIcon = () => {
    switch (severity) {
      case 'error':
        return '⚠️';
      case 'warning':
        return '⚡';
      case 'info':
        return 'ℹ️';
      default:
        return '⚠️';
    }
  };

  return (
    <div className={`error-message variant-${variant} severity-${severity}`}>
      {showIcon && <div className="error-icon">{getIcon()}</div>}
      <div className="error-content">
        <p className="error-text">{message}</p>
        {details && <p className="error-details">{details}</p>}
        {category && <p className="error-category">{category}</p>}
      </div>
      {onDismiss && (
        <button className="dismiss-button" onClick={handleDismiss}>
          ×
        </button>
      )}
    </div>
  );
};

ErrorMessage.propTypes = {
  message: PropTypes.string.isRequired,
  details: PropTypes.string,
  category: PropTypes.string,
  duration: PropTypes.number,
  onDismiss: PropTypes.func,
  showIcon: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'toast', 'inline']),
  severity: PropTypes.oneOf(['error', 'warning', 'info']),
};

export default ErrorMessage;
