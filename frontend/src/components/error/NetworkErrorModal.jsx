import PropTypes from 'prop-types';
import React from 'react';
import Modal from '../common/Modal';

/**
 * Modal component to display when a network error occurs
 * This provides a user-friendly message about connection issues
 */
const NetworkErrorModal = ({ isOpen, onClose, message }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connection Error"
      size="SMALL"
      type="alert"
      showCloseButton={true}
      data-modal-type="network-error"
    >
      <div className="network-error-modal">
        <div className="network-error-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
          <button className="btn btn-secondary" onClick={onClose}>
            Continue in Limited Mode
          </button>
        </div>
      </div>
    </Modal>
  );
};

NetworkErrorModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  message: PropTypes.string,
};

NetworkErrorModal.defaultProps = {
  isOpen: false,
  message: 'Could not connect to server. Some features may be unavailable.',
};

export default NetworkErrorModal;
