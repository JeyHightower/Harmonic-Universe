import React from 'react';
import PropTypes from 'prop-types';

/**
 * Simple modal content component for network errors
 * Used by the Modal system without introducing circular dependencies
 */
const NetworkErrorModalContent = ({ message, onClose }) => {
    return (
        <div className="network-error-modal">
            <div className="network-error-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
            <div className="network-error-message">
                <p>{message || 'Could not connect to server. Some features may be unavailable.'}</p>
                <p className="network-error-help">
                    Please check your internet connection and try again later.
                </p>
            </div>
            <div className="network-error-actions">
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        window.location.reload();
                    }}
                >
                    Refresh Page
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={onClose}
                >
                    Continue in Limited Mode
                </button>
            </div>
        </div>
    );
};

NetworkErrorModalContent.propTypes = {
    message: PropTypes.string,
    onClose: PropTypes.func.isRequired
};

NetworkErrorModalContent.defaultProps = {
    message: 'Could not connect to server. Some features may be unavailable.'
};

export default NetworkErrorModalContent;
