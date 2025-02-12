import PropTypes from 'prop-types';
import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({
  error,
  className = '',
  variant = 'default',
  onDismiss = null,
}) => {
  if (!error) return null;

  const baseClass = 'error-message';
  const variantClass = `${baseClass}--${variant}`;
  const customClass = className ? ` ${className}` : '';
  const fullClassName = `${baseClass} ${variantClass}${customClass}`;

  return (
    <div className={fullClassName} role="alert">
      <div className="error-message__content">
        {typeof error === 'string' ? error : error.message}
      </div>
      {onDismiss && (
        <button
          className="error-message__dismiss"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </div>
  );
};

ErrorMessage.propTypes = {
  error: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      message: PropTypes.string.isRequired,
      details: PropTypes.object,
    }),
  ]),
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'warning', 'critical']),
  onDismiss: PropTypes.func,
};

export default ErrorMessage;
