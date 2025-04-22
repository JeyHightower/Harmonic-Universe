import PropTypes from 'prop-types';
import { MODAL_CONFIG } from '../../utils/config';
import { ModalSystem } from '../modals';

/**
 * Modal component that provides backward compatibility with the original Modal API
 * This is a wrapper around ModalSystem for backward compatibility
 */
const Modal = ({
  isOpen,
  onClose,
  children,
  type = MODAL_CONFIG.TYPES.DEFAULT,
  size = MODAL_CONFIG.SIZES.MEDIUM,
  position = MODAL_CONFIG.POSITIONS.CENTER,
  animation = MODAL_CONFIG.ANIMATIONS.FADE,
  draggable = MODAL_CONFIG.DEFAULT_SETTINGS.draggable,
  closeOnEscape = MODAL_CONFIG.DEFAULT_SETTINGS.closeOnEscape,
  closeOnBackdrop = MODAL_CONFIG.DEFAULT_SETTINGS.closeOnBackdrop,
  preventBodyScroll = MODAL_CONFIG.DEFAULT_SETTINGS.preventBodyScroll,
  showCloseButton = MODAL_CONFIG.DEFAULT_SETTINGS.showCloseButton,
  title,
  style = {},
}) => {
  // Enhanced close handler to ensure proper event handling
  const handleClose = (e) => {
    // Only close if clicking on backdrop or explicit close button
    if (e && e.target) {
      const isModalContent = e.target.closest('.modal-content');
      const isModalBackdrop = e.target.closest('.modal-backdrop') === e.target;

      // If clicking inside modal content (not backdrop), don't close
      if (isModalContent && !isModalBackdrop) {
        console.log('Modal: Content click, not closing');
        if (e.stopPropagation) {
          e.stopPropagation();
          e.preventDefault();
        }
        return; // Don't close
      }
    }

    // Ensure event propagation is stopped
    if (e && e.stopPropagation) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (onClose && typeof onClose === 'function') {
      onClose();
    }
  };

  // Custom content click handler to prevent bubbling
  const contentClickHandler = (e) => {
    e.stopPropagation();
  };

  const enhancedChildren = (
    <div
      onClick={contentClickHandler}
      style={{ pointerEvents: 'auto', width: '100%', height: '100%' }}
    >
      {children}
    </div>
  );

  // Map the old props to the new ModalSystem props
  return (
    <ModalSystem
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      type={type}
      size={size}
      position={position}
      animation={animation}
      draggable={draggable}
      closeOnEscape={closeOnEscape}
      closeOnBackdrop={closeOnBackdrop}
      preventBodyScroll={preventBodyScroll}
      showCloseButton={showCloseButton}
      preventBackdropClick={false}
      style={{
        zIndex: 1050,
        pointerEvents: 'auto',
        ...style,
      }}
    >
      {enhancedChildren}
    </ModalSystem>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(Object.values(MODAL_CONFIG.TYPES)),
  size: PropTypes.oneOf(Object.values(MODAL_CONFIG.SIZES)),
  position: PropTypes.oneOf(Object.values(MODAL_CONFIG.POSITIONS)),
  animation: PropTypes.oneOf(Object.values(MODAL_CONFIG.ANIMATIONS)),
  draggable: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
  closeOnBackdrop: PropTypes.bool,
  preventBodyScroll: PropTypes.bool,
  showCloseButton: PropTypes.bool,
  title: PropTypes.string,
  style: PropTypes.object,
};

export default Modal;
