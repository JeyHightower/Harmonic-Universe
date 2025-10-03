import { Modal } from 'antd';
import PropTypes from 'prop-types';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ensurePortalRoot } from '../../utils/portalUtils.jsx';
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
  // Debug log for modal open state
  console.log('StableModalWrapper render: open =', open);
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
    if (open) {
      alert('StableModalWrapper - Setting isVisible to true');
    } else {
      alert('StableModalWrapper - Setting isVisible to false');
    }
    setIsVisible(open);
  }, [open]);

  const handleClose = () => {
    alert('StableModalWrapper - handleClose called');
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

  // Fix button interactions specifically
  const fixButtonInteractions = () => {
    if (open) {
      setTimeout(() => {
        // Fix close button
        const closeButtons = document.querySelectorAll(
          '.ant-modal-close, .modal-close, button[aria-label="Close"]'
        );
        closeButtons.forEach((button) => {
          button.style.setProperty('pointer-events', 'auto', 'important');
          button.style.setProperty('z-index', '100000', 'important');
          button.style.setProperty('position', 'relative', 'important');
          button.style.setProperty('cursor', 'pointer', 'important');
        });

        // Fix form buttons
        const formButtons = document.querySelectorAll(
          '.ant-modal-body button, .modal-body button, .scene-form button'
        );
        formButtons.forEach((button) => {
          button.style.setProperty('pointer-events', 'auto', 'important');
          button.style.setProperty('z-index', '100000', 'important');
          button.style.setProperty('position', 'relative', 'important');
          button.style.setProperty('cursor', 'pointer', 'important');
        });

        console.log('Button interactions fixed');
      }, 200);
    }
  };

  if (open) {
    console.log('StableModalWrapper - About to render Modal with isVisible: ' + isVisible);
    // Fix button interactions
    fixButtonInteractions();
    // Check if modal elements exist in DOM after a short delay
    setTimeout(() => {
      const modalElements = document.querySelectorAll('.ant-modal');
      const modalWraps = document.querySelectorAll('.ant-modal-wrap');
      const modalMasks = document.querySelectorAll('.ant-modal-mask');
      console.log(
        `Modal elements found: ${modalElements.length} modals, ${modalWraps.length} wraps, ${modalMasks.length} masks`
      );

      if (modalElements.length > 0) {
        const modal = modalElements[modalElements.length - 1];
        const computedStyle = window.getComputedStyle(modal);
        const rect = modal.getBoundingClientRect();
        console.log(
          `Modal CSS: display=${computedStyle.display}, visibility=${computedStyle.visibility}, opacity=${computedStyle.opacity}, z-index=${computedStyle.zIndex}`
        );
        console.log(
          `Modal position: top=${rect.top}, left=${rect.left}, width=${rect.width}, height=${rect.height}, visible=${rect.width > 0 && rect.height > 0}`
        );

        // Check if modal content exists
        const modalContent = modal.querySelector('.ant-modal-content');
        if (modalContent) {
          console.log('Modal content found: ' + modalContent.innerHTML.substring(0, 100) + '...');
        } else {
          console.log('No modal content found!');
        }

        // Check modal backdrop
        const modalMask = document.querySelector('.ant-modal-mask');
        if (modalMask) {
          const maskStyle = window.getComputedStyle(modalMask);
          console.log(
            `Modal mask: display=${maskStyle.display}, visibility=${maskStyle.visibility}, opacity=${maskStyle.opacity}, background-color=${maskStyle.backgroundColor}`
          );
        } else {
          console.log('No modal mask found!');
        }
      }
    }, 100);
  }
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
      zIndex={9999}
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
          zIndex: 9998,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
        style: { pointerEvents: 'auto', zIndex: 9998 },
      }}
      getContainer={() => {
        const portalRoot = document.getElementById('portal-root');
        if (open) {
          console.log('Portal root exists: ' + !!portalRoot);
        }
        return document.body; // Force render to body to avoid portal issues
      }}
      modalRender={(node) => (
        <div
          onClick={handleContentWrapperClick}
          className="modal-content-wrapper"
          style={{
            pointerEvents: 'auto',
            zIndex: 9999,
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
          zIndex: 9999,
        }}
      >
        {stableContent}
        {/* Force button interactions */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            setTimeout(() => {
              const buttons = document.querySelectorAll('.ant-modal-close, .ant-modal-body button, .modal-body button, .scene-form button');
              buttons.forEach(button => {
                button.style.pointerEvents = 'auto';
                button.style.zIndex = '100000';
                button.style.position = 'relative';
                button.style.cursor = 'pointer';
              });
            }, 100);
          `,
          }}
        />
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
