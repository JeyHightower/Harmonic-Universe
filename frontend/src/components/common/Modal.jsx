import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef(null);
  const previousFocus = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const portalRoot = document.getElementById('portal-root') || document.body;

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200); // Match the CSS transition duration
  }, [onClose, isClosing]);

  // Handle body class and focus management
  useEffect(() => {
    let originalStyles = {};

    if (isOpen) {
      // Store original body styles
      originalStyles = {
        position: document.body.style.position,
        top: document.body.style.top,
        width: document.body.style.width,
        overflow: document.body.style.overflow,
      };

      // Store the current focused element and scroll position
      previousFocus.current = document.activeElement;
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);

      // Add class to body to prevent scroll
      document.body.classList.add('modal-open');
      document.body.style.position = 'fixed';
      document.body.style.top = `-${currentScrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      // Focus the modal
      requestAnimationFrame(() => {
        modalRef.current?.focus();
      });
    }

    return () => {
      // Restore body state
      document.body.classList.remove('modal-open');
      document.body.style.position = originalStyles.position || '';
      document.body.style.top = originalStyles.top || '';
      document.body.style.width = originalStyles.width || '';
      document.body.style.overflow = originalStyles.overflow || '';

      if (isOpen) {
        window.scrollTo(0, scrollY);

        // Restore focus
        if (previousFocus.current) {
          previousFocus.current.focus();
          previousFocus.current = null;
        }
      }
    };
  }, [isOpen, scrollY]);

  // Handle ESC key press
  useEffect(() => {
    const handleEscape = event => {
      if (event.key === 'Escape' && isOpen && !isClosing) {
        event.preventDefault();
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isClosing, handleClose]);

  // Handle overlay click
  const handleOverlayClick = useCallback(
    event => {
      if (event.target === event.currentTarget && !isClosing) {
        handleClose();
      }
    },
    [handleClose, isClosing]
  );

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`modal ${isClosing ? 'modal-closing' : ''}`}
        tabIndex={-1}
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={handleClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, portalRoot);
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default Modal;
