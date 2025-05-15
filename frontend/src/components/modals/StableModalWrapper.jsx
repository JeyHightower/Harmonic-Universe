import { Modal } from 'antd';
import PropTypes from 'prop-types';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ensurePortalRoot } from '../../utils/portalUtils.mjs';
import './Modal.css';

/**
 * A wrapper around Ant Design's Modal component that ensures stability
 * and prevents unnecessary re-renders.
 */
const StableModalWrapper = ({
  open,
  onClose,
  title,
  width = 520,
  style = {},
  footer = undefined,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(open);

  // Initialize with debugging
  console.log('StableModalWrapper - COMPONENT INITIALIZED', {
    componentName: 'StableModalWrapper',
    open,
    isVisible,
  });

  // Create the portal root when the component mounts
  useEffect(() => {
    ensurePortalRoot();
  }, []);

  // Debug effect for open prop changes
  useEffect(() => {
    console.log('StableModalWrapper - open prop changed:', {
      previousIsVisible: isVisible,
      newOpen: open,
    });
    setIsVisible(open);
  }, [open]);

  // Debug effect for visibility state changes
  useEffect(() => {
    console.log('StableModalWrapper - isVisible state changed:', { isVisible });
  }, [isVisible]);

  const handleClose = () => {
    console.log('StableModalWrapper - handleClose called');
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  // Create a stable reference to the content
  const stableContent = useMemo(() => children, [children]);

  // Combine default and passed styles
  const combinedStyles = useMemo(
    () => ({
      ...style,
    }),
    [style]
  );

  const modalRef = useRef(null);
  const instanceId = useRef(`modal-${Math.random().toString(36).substr(2, 9)}`);

  // Add debug logging
  useEffect(() => {
    console.log('StableModalWrapper - Rendering with props:', { title, open, width });

    // Log when the modal should be visible
    if (open) {
      console.log('StableModalWrapper - Modal is set to be visible');

      // Ensure consistent body scroll locking
      if (document.body.style.overflow !== 'hidden') {
        document.body.style.overflow = 'hidden';
      }
    } else {
      console.log('StableModalWrapper - Modal is set to be hidden');
      // Only restore body overflow if this is the last modal
      if (!document.querySelector('.ant-modal:not(.stable-modal-' + instanceId.current + ')')) {
        document.body.style.overflow = '';
      }
    }

    return () => {
      // Cleanup on unmount
      if (
        open &&
        !document.querySelector('.ant-modal:not(.stable-modal-' + instanceId.current + ')')
      ) {
        document.body.style.overflow = '';
      }
    };
  }, [title, open, width]);

  // Safe close handler that won't trigger for content clicks
  const handleModalClick = (e) => {
    // Always stop propagation to prevent underlying modals from receiving events
    e.stopPropagation();
  };

  // Handle clicks on the modal content wrapper
  const handleContentWrapperClick = (e) => {
    // Prevent events from reaching backdrop
    e.stopPropagation();
  };

  // Enhanced interaction handler for form fields
  const handleFormFieldInteraction = (e) => {
    e.stopPropagation();

    if (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA' ||
      e.target.tagName === 'SELECT'
    ) {
      // Ensure focus works
      setTimeout(() => {
        if (document.activeElement !== e.target) {
          e.target.focus();
        }
      }, 0);
    }
  };

  // Log right before rendering
  console.log('StableModalWrapper - About to render Modal with open=', open, 'title=', title);
  console.log('StableModalWrapper - Close handlers enabled: keyboard=true, maskClosable=true');

  // Create standard footer with cancel button
  const createFooter = () => {
    return (
      <div className="modal-footer">
        <button className="modal-cancel-btn" onClick={handleClose} aria-label="Cancel">
          Cancel
        </button>
      </div>
    );
  };

  const combinedStyle = {
    display: 'block',
    visibility: 'visible',
    pointerEvents: 'auto', // Ensure modal gets pointer events
    ...style,
  };

  return (
    <Modal
      title={title}
      open={isVisible}
      onCancel={handleClose}
      footer={footer === null ? null : footer || createFooter()}
      width={width}
      destroyOnHidden={true}
      maskClosable={true}
      className={`stable-modal stable-modal-${instanceId.current}`}
      style={combinedStyle}
      zIndex={1050}
      forceRender={true}
      onClick={handleModalClick}
      wrapClassName="stable-modal-wrap"
      keyboard={true}
      centered={true}
      closeIcon={true}
      getContainer={() => document.getElementById('portal-root') || document.body}
      modalRender={(node) => (
        <div
          onClick={handleContentWrapperClick}
          className="modal-content-wrapper"
          style={{ pointerEvents: 'auto' }}
        >
          {node}
        </div>
      )}
    >
      <div
        className="modal-inner-content"
        onClick={handleModalClick}
        onMouseDown={handleFormFieldInteraction}
        onTouchStart={handleFormFieldInteraction}
        style={{
          pointerEvents: 'auto',
          position: 'relative',
          zIndex: 1051,
        }}
      >
        {stableContent}
      </div>
    </Modal>
  );
};

StableModalWrapper.propTypes = {
  title: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  style: PropTypes.object,
  footer: PropTypes.oneOfType([PropTypes.node, PropTypes.bool]),
  children: PropTypes.node.isRequired,
};

export default StableModalWrapper;
