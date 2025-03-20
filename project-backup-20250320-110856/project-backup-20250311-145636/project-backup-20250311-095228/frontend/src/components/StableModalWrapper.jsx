import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import '../styles/StableModalWrapper.css';

// This component ensures that modal instances remain stable
// and don't re-render unnecessarily
const StableModalWrapper = ({ children, onClose, isOpen }) => {
  const [portalRoot, setPortalRoot] = useState(null);

  const handleEscape = useCallback((event) => {
    if (event.key === 'Escape' && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  const handleClickOutside = useCallback((event) => {
    // Only close if clicking directly on the backdrop
    if (event.target.classList.contains('modal-wrapper')) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    // Find or create portal root
    let root = document.getElementById('portal-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'portal-root';
      document.body.appendChild(root);
    }
    setPortalRoot(root);

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
      // Only remove if dynamically created
      if (root && !document.querySelector('html > body > #portal-root')) {
        document.body.removeChild(root);
      }
    };
  }, [isOpen, handleEscape, handleClickOutside]);

  if (!portalRoot || !isOpen) return null;

  return createPortal(
    <div
      className="modal-wrapper"
      onClick={handleClickOutside}
      role="dialog"
      aria-modal="true"
    >
      {React.Children.map(children, child =>
        React.cloneElement(child, {
          onClose,
          'aria-modal': true,
        })
      )}
    </div>,
    portalRoot
  );
};

StableModalWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
};

export default StableModalWrapper;
