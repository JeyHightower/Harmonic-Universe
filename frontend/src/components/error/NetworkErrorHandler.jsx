import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * NetworkErrorHandler - A component that listens for network errors and displays an
 * error message when CORS or other network issues are detected.
 */
const NetworkErrorHandler = ({ children }) => {
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to handle global errors
    const handleError = (event) => {
      // Check if this is a network-related error
      const errorText = event.reason?.message || event.message || '';

      if (
        errorText.includes('Network Error') ||
        errorText.includes('CORS') ||
        errorText.includes('Failed to fetch') ||
        errorText.includes('net::ERR')
      ) {
        console.error('Network error detected:', errorText);
        setError({
          type: 'network',
          message: errorText,
          timestamp: new Date().toISOString(),
        });

        // Prevent the error from being handled elsewhere
        event.preventDefault();
      }
    };

    // Set up event listeners for both types of errors
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      // Clean up
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  // If there's no error, just render children
  if (!error) {
    return children;
  }

  // Render the error UI
  return (
    <div className="network-error-container" style={containerStyle}>
      <div className="network-error-content" style={contentStyle}>
        <h2 style={headingStyle}>Connection Error</h2>
        <p style={messageStyle}>
          We're having trouble connecting to the server. This might be due to:
        </p>
        <ul style={listStyle}>
          <li>CORS configuration issues</li>
          <li>Backend server not running</li>
          <li>Network connectivity problems</li>
        </ul>
        <div style={detailsStyle}>
          <p>
            <strong>Error details:</strong> {error.message}
          </p>
          <p>
            <strong>Time:</strong> {new Date(error.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <div style={actionsStyle}>
          <button onClick={() => setError(null)} style={primaryButtonStyle}>
            Dismiss
          </button>
          <button onClick={() => window.location.reload()} style={secondaryButtonStyle}>
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
};

// Styles
const containerStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  zIndex: 9999,
};

const contentStyle = {
  backgroundColor: 'white',
  padding: '30px',
  borderRadius: '8px',
  maxWidth: '500px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
};

const headingStyle = {
  color: '#d32f2f',
  margin: '0 0 20px 0',
  fontSize: '24px',
};

const messageStyle = {
  margin: '0 0 15px 0',
  fontSize: '16px',
  lineHeight: '1.5',
};

const listStyle = {
  marginBottom: '20px',
  paddingLeft: '20px',
};

const detailsStyle = {
  padding: '15px',
  backgroundColor: '#f5f5f5',
  borderRadius: '4px',
  fontSize: '14px',
  marginBottom: '20px',
};

const actionsStyle = {
  display: 'flex',
  justifyContent: 'space-between',
};

const buttonBaseStyle = {
  padding: '10px 16px',
  borderRadius: '4px',
  border: 'none',
  fontSize: '14px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
};

const primaryButtonStyle = {
  ...buttonBaseStyle,
  backgroundColor: '#2196f3',
  color: 'white',
};

const secondaryButtonStyle = {
  ...buttonBaseStyle,
  backgroundColor: '#e0e0e0',
  color: '#333',
};

NetworkErrorHandler.propTypes = {
  children: PropTypes.node.isRequired,
};

export default NetworkErrorHandler;
