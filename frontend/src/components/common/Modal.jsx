import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef } from 'react';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Store the current focused element
      previousFocus.current = document.activeElement;

      // Add class to body to prevent scroll
      document.body.classList.add('modal-open');

      // Focus the modal
      modalRef.current?.focus();
    } else {
      // Remove class from body
      document.body.classList.remove('modal-open');

      // Restore focus
      if (previousFocus.current) {
        previousFocus.current.focus();
      }
    }

    return () => {
      document.body.classList.remove('modal-open');
      if (previousFocus.current) {
        previousFocus.current.focus();
      }
    };
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleEscape = event => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Handle overlay click
  const handleOverlayClick = useCallback(
    event => {
      // Only close if clicking the overlay background
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Handle close button click
  const handleCloseClick = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div ref={modalRef} className="modal" tabIndex={-1}>
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={handleCloseClick}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default Modal;
