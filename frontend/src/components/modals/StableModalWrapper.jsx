import { Modal } from "antd";
import PropTypes from "prop-types";
import { useEffect, useRef } from "react";
import { log } from "../../utils/logger.mjs";
import { ensurePortalRoot } from "../../utils/portalUtils.mjs";
import "./Modal.css";

// This component ensures that modal instances remain stable
// and don't re-render unnecessarily
const StableModalWrapper = ({ title, children, onClose, width = 520, open = true, style }) => {
  // Add additional debug logging for component initialization
  console.log("StableModalWrapper - Component initialized with props:", {
    title,
    open,
    width,
    hasChildren: !!children,
    hasCloseHandler: !!onClose
  });

  const modalRef = useRef(null);
  const instanceId = useRef(`modal-${Math.random().toString(36).substr(2, 9)}`);

  // Ensure portal exists and is ready
  useEffect(() => {
    ensurePortalRoot();
  }, []);

  // Add debug logging
  useEffect(() => {
    console.log("StableModalWrapper - Rendering with props:", { title, open, width });

    // Log when the modal should be visible
    if (open) {
      console.log("StableModalWrapper - Modal is set to be visible");

      // Ensure consistent body scroll locking
      if (document.body.style.overflow !== 'hidden') {
        document.body.style.overflow = 'hidden';
      }
    } else {
      console.log("StableModalWrapper - Modal is set to be hidden");
      // Only restore body overflow if this is the last modal
      if (!document.querySelector('.ant-modal:not(.stable-modal-' + instanceId.current + ')')) {
        document.body.style.overflow = '';
      }
    }

    return () => {
      // Cleanup on unmount
      if (open && !document.querySelector('.ant-modal:not(.stable-modal-' + instanceId.current + ')')) {
        document.body.style.overflow = '';
      }
    };
  }, [title, open, width]);

  // Safe close handler that won't trigger for content clicks
  const handleClose = (e) => {
    // Check if this is a direct call from Ant Design's onCancel
    // If it has a target, ensure this came from clicking the actual backdrop
    // and not from inside the modal content
    if (e && e.target) {
      // Get the modal content element
      const modalContent = document.querySelector(`.stable-modal-${instanceId.current} .ant-modal-content`);

      // Check if the click target is inside the modal content
      if (modalContent && (modalContent === e.target || modalContent.contains(e.target))) {
        console.log("StableModalWrapper - Ignoring close event from inside modal content");
        e.stopPropagation();
        return; // Don't close if clicked inside the modal
      }

      // For safety, we still stop propagation
      e.stopPropagation();
    }

    log("modal", "Modal closed", { title });
    console.log("StableModalWrapper - Modal closing", { title });

    if (onClose) {
      onClose();
    }
  };

  // Handle clicks specifically to prevent event bubbling issues
  const handleModalClick = (e) => {
    // Always stop propagation to prevent underlying modals from receiving events
    e.stopPropagation();
  };

  // Handle clicks on the modal content wrapper
  const handleContentWrapperClick = (e) => {
    // Prevent events from reaching backdrop
    e.stopPropagation();
  };

  // Log right before rendering
  console.log("StableModalWrapper - About to render Modal with open=", open);

  const combinedStyle = {
    display: 'block',
    visibility: 'visible',
    pointerEvents: 'auto', // Ensure modal gets pointer events
    ...style
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={handleClose}
      footer={null}
      width={width}
      destroyOnClose={true}
      maskClosable={true} // Keep this true, but our handleClose will filter which clicks actually close
      className={`stable-modal stable-modal-${instanceId.current}`}
      style={combinedStyle}
      zIndex={1050} // Consistent z-index with other modals
      forceRender={true}
      ref={modalRef}
      onClick={handleModalClick}
      wrapClassName="stable-modal-wrap"
      keyboard={true}
      centered={true}
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
        style={{
          pointerEvents: 'auto',
          position: 'relative', // Ensure proper stacking context
          zIndex: 1051 // Higher than the backdrop
        }}
      >
        {children}
      </div>
    </Modal>
  );
};

StableModalWrapper.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func,
  width: PropTypes.number,
  open: PropTypes.bool,
  style: PropTypes.object,
};

export default StableModalWrapper;
