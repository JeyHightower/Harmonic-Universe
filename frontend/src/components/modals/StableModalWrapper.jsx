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
  const modalRef = useRef(null);
  const instanceId = useRef(`modal-${Math.random().toString(36).substr(2, 9)}`);

  // Debug logging
  console.log('StableModalWrapper - COMPONENT INITIALIZED', {
    id: instanceId.current,
    open,
  });

  // Create the portal root when the component mounts
  useEffect(() => {
    ensurePortalRoot();
  }, []);

  // Sync the open prop to internal state
  useEffect(() => {
    console.log('StableModalWrapper - open prop changed:', open);
    setIsVisible(open);
  }, [open]);

  const handleClose = () => {
    console.log('StableModalWrapper - handleClose called');
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  // Create a stable reference to the content
  const stableContent = useMemo(() => children, [children]);

  // Combined styles to ensure the modal is visible and interactive
  const combinedStyle = useMemo(
    () => ({
      display: 'block',
      visibility: 'visible',
      pointerEvents: 'auto',
      ...style,
    }),
    [style]
  );

  // Handle clicks on the modal itself
  const handleModalClick = (e) => {
    e.stopPropagation(); // Stop propagation to prevent unwanted effects
    console.log('Modal content clicked');
  };

  // Handle clicks on the content wrapper
  const handleContentWrapperClick = (e) => {
    e.stopPropagation(); // Stop propagation to prevent backdrop from closing
    console.log('Content wrapper clicked');
  };

  // Enhanced form field interaction handler
  const handleFormFieldInteraction = (e) => {
    // This is critical - stop propagation to prevent modal closing
    e.stopPropagation();

    const target = e.target;
    const tagName = target.tagName.toLowerCase();

    console.log(`Modal input interaction: ${tagName}`);

    // Make sure the element is fully interactive
    if (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      tagName === 'button'
    ) {
      // Apply extreme styling to ensure the element is interactive
      target.style.setProperty('pointer-events', 'auto', 'important');
      target.style.setProperty('z-index', '999999', 'important');
      target.style.setProperty('position', 'relative', 'important');

      // For inputs/textareas/selects, focus them
      if (tagName !== 'button') {
        setTimeout(() => {
          target.focus();
          console.log('Focused input');
        }, 10);
      }
    }
  };

  return (
    <Modal
      title={title}
      open={isVisible}
      onCancel={handleClose}
      footer={footer === null ? null : footer}
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
      // Critical props for interaction
      mask={true}
      styles={{
        mask: {
          pointerEvents: 'auto',
          zIndex: 1050,
        },
      }}
      wrapProps={{
        onClick: (e) => {
          // Only close if directly clicking the backdrop
          const isDirectWrapClick = e.target.classList.contains('ant-modal-wrap');
          if (isDirectWrapClick) {
            handleClose();
          }
          e.stopPropagation();
        },
        style: { pointerEvents: 'auto', zIndex: 1050 },
      }}
      getContainer={() => document.getElementById('portal-root') || document.body}
      modalRender={(node) => (
        <div
          onClick={handleContentWrapperClick}
          className="modal-content-wrapper"
          style={{
            pointerEvents: 'auto',
            zIndex: 1051,
            position: 'relative',
          }}
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
