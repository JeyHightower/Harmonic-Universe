import PropTypes from 'prop-types';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

// Global counter for tracking modal stack depth
let modalStackCount = 0;

const Modal = forwardRef(
  (
    {
      isOpen,
      onClose,
      title,
      children,
      size = 'medium', // 'small', 'medium', 'large', 'full'
      type = 'default', // 'default', 'alert', 'confirm', 'form'
      animation = 'fade', // 'fade', 'slide', 'zoom', 'none'
      position = 'center', // 'center', 'top', 'bottom'
      showCloseButton = true,
      preventBackdropClick = false,
      contentClassName = '',
      footerContent = null,
    },
    ref
  ) => {
    const modalRef = useRef(null);
    const previousFocus = useRef(null);
    const [isClosing, setIsClosing] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const [stackLevel, setStackLevel] = useState(0);
    const portalRoot = document.getElementById('portal-root') || document.body;

    // Use the forwarded ref if provided, otherwise use our internal ref
    const combinedRef = ref || modalRef;

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
        // Increment modal stack count
        modalStackCount++;
        setStackLevel(modalStackCount);

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

        // Only fix body if this is the first modal in the stack
        if (modalStackCount === 1) {
          // Add class to body to prevent scroll
          document.body.classList.add('modal-open');
          document.body.style.position = 'fixed';
          document.body.style.top = `-${currentScrollY}px`;
          document.body.style.width = '100%';
          document.body.style.overflow = 'hidden';
        }

        // Focus the modal
        requestAnimationFrame(() => {
          if (modalRef.current) {
            modalRef.current.focus();
          }
        });
      }

      return () => {
        if (isOpen) {
          // Decrement modal stack count
          modalStackCount--;

          // Only restore body state if this is the last modal in the stack
          if (modalStackCount === 0) {
            document.body.classList.remove('modal-open');
            document.body.style.position = originalStyles.position || '';
            document.body.style.top = originalStyles.top || '';
            document.body.style.width = originalStyles.width || '';
            document.body.style.overflow = originalStyles.overflow || '';
            window.scrollTo(0, scrollY);
          }

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
        if (
          !preventBackdropClick &&
          event.target === event.currentTarget &&
          !isClosing
        ) {
          handleClose();
        }
      },
      [handleClose, isClosing, preventBackdropClick]
    );

    if (!isOpen) return null;

    // Determine modal classes based on props
    const modalClasses = [
      'modal',
      `modal-size-${size}`,
      `modal-type-${type}`,
      `modal-animation-${animation}`,
      `modal-position-${position}`,
      isClosing ? 'modal-closing' : '',
    ]
      .filter(Boolean)
      .join(' ');

    // Determine overlay classes
    const overlayClasses = [
      'modal-overlay',
      `modal-overlay-animation-${animation}`,
      isClosing ? 'modal-overlay-closing' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const modalContent = (
      <div
        className={overlayClasses}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{ zIndex: 9999 + stackLevel }} // Increase z-index based on stack level
        ref={combinedRef}
      >
        <div
          ref={modalRef}
          className={modalClasses}
          tabIndex={-1}
          aria-labelledby="modal-title"
        >
          <div className="modal-header">
            <h2 id="modal-title">{title}</h2>
            {showCloseButton && (
              <button
                type="button"
                className="modal-close"
                onClick={handleClose}
                aria-label="Close modal"
              >
                ×
              </button>
            )}
          </div>
          <div className={`modal-content ${contentClassName}`}>{children}</div>
          {footerContent && <div className="modal-footer">{footerContent}</div>}
        </div>
      </div>
    );

    return createPortal(modalContent, portalRoot);
  }
);

Modal.displayName = 'Modal';

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'full']),
  type: PropTypes.oneOf(['default', 'alert', 'confirm', 'form']),
  animation: PropTypes.oneOf(['fade', 'slide', 'zoom', 'none']),
  position: PropTypes.oneOf(['center', 'top', 'bottom']),
  showCloseButton: PropTypes.bool,
  preventBackdropClick: PropTypes.bool,
  contentClassName: PropTypes.string,
  footerContent: PropTypes.node,
};

export default Modal;
