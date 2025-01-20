import PropTypes from 'prop-types';
import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({ message, onRetry }) => {
  // Format error message to be more user-friendly
  const formatErrorMessage = error => {
    if (typeof error === 'string') {
      // Remove technical details and format common error messages
      if (error.includes('Network Error')) {
        return 'Unable to connect to the server. Please check your internet connection.';
      }
      if (error.includes('404')) {
        return 'The requested resource was not found.';
      }
      if (error.includes('401')) {
        return 'Please log in to continue.';
      }
      if (error.includes('403')) {
        return 'You do not have permission to perform this action.';
      }
      if (error.includes('500')) {
        return 'Something went wrong on our end. Please try again later.';
      }
      return error;
    }
    return 'An unexpected error occurred. Please try again.';
  };

  const formattedMessage = formatErrorMessage(message);

  return (
    <div className="error-message">
      <div className="error-icon">⚠️</div>
      <p className="error-text">{formattedMessage}</p>
      {onRetry && (
        <button className="retry-button" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
};

ErrorMessage.propTypes = {
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  onRetry: PropTypes.func,
};

export default ErrorMessage;
