import PropTypes from 'prop-types';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import '../../styles/modal.css';

// Global counter for tracking modal stack depth
let modalStackCount = 0;

const Modal = forwardRef(
  (
    {
      isOpen,
      onClose,
      title = 'Modal',
      children,
      size = 'medium', // 'small', 'medium', 'large', 'full'
      type = 'default', // 'default', 'alert', 'confirm', 'form'
      animation = 'fade', // 'fade', 'slide', 'zoom', 'none'
      position = 'center', // 'center', 'top', 'bottom'
      showCloseButton = true,
      preventBackdropClick = false,
      contentClassName = '',
      footerContent = null,
      ariaDescribedBy = '', // New prop for additional accessibility
      initialFocusRef = null, // New prop to specify which element gets initial focus
    },
    ref
  ) => {
    const modalRef = useRef(null);
    const contentRef = useRef(null);
    const previousFocus = useRef(null);
    const [isClosing, setIsClosing] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const [stackLevel, setStackLevel] = useState(0);
    const portalRoot = document.getElementById('portal-root') || document.body;
    const modalId = useRef(`modal-${Math.random().toString(36).substr(2, 9)}`);
    const titleId = `${modalId.current}-title`;
    const contentId = `${modalId.current}-content`;

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

    // Focus trap implementation
    useEffect(() => {
      if (!isOpen || !modalRef.current) return;

      const modalElement = modalRef.current;

      // Get all focusable elements within the modal
      const focusableElements = modalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleTabKey = e => {
        // If not Tab key, do nothing
        if (e.key !== 'Tab') return;

        // If Shift+Tab on first element, move to last element
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
        // If Tab on last element, move to first element
        else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      };

      const handleKeyDown = e => {
        handleTabKey(e);
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [isOpen]);

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

        // Focus the specified element or default to modal
        requestAnimationFrame(() => {
          if (initialFocusRef && initialFocusRef.current) {
            initialFocusRef.current.focus();
          } else if (modalRef.current) {
            // Find the first focusable element in the modal
            const firstFocusable = modalRef.current.querySelector(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            if (firstFocusable) {
              firstFocusable.focus();
            } else {
              modalRef.current.focus();
            }
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
    }, [isOpen, initialFocusRef]);

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

    // Determine aria attributes
    const ariaAttributes = {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': titleId,
    };

    // Only add aria-describedby if we have a description
    if (ariaDescribedBy) {
      ariaAttributes['aria-describedby'] = ariaDescribedBy;
    } else if (contentId) {
      ariaAttributes['aria-describedby'] = contentId;
    }

    const modalContent = (
      <div
        className={overlayClasses}
        onClick={handleOverlayClick}
        style={{ zIndex: 9999 + stackLevel }} // Increase z-index based on stack level
        ref={combinedRef}
        {...ariaAttributes}
      >
        <div ref={modalRef} className={modalClasses} tabIndex={-1}>
          <div className="modal-header">
            <h2 id={titleId}>{title}</h2>
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
          <div
            id={contentId}
            ref={contentRef}
            className={`modal-content ${contentClassName}`}
          >
            {children}
          </div>
          {footerContent && <div className="modal-footer">{footerContent}</div>}
        </div>
      </div>
    );

    return createPortal(modalContent, portalRoot);
  }
);

Modal.displayName = 'Modal';

Modal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'full']),
  type: PropTypes.oneOf(['default', 'alert', 'confirm', 'form']),
  animation: PropTypes.oneOf(['fade', 'slide', 'zoom', 'none']),
  position: PropTypes.oneOf(['center', 'top', 'bottom']),
  showCloseButton: PropTypes.bool,
  preventBackdropClick: PropTypes.bool,
  contentClassName: PropTypes.string,
  footerContent: PropTypes.node,
  ariaDescribedBy: PropTypes.string,
  initialFocusRef: PropTypes.shape({ current: PropTypes.any }),
};

Modal.defaultProps = {
  isOpen: false,
  onClose: () => {},
  title: 'Modal',
  children: null,
  size: 'medium',
  type: 'default',
  animation: 'fade',
  position: 'center',
  showCloseButton: true,
  preventBackdropClick: false,
  contentClassName: '',
  footerContent: null,
  ariaDescribedBy: '',
  initialFocusRef: null,
};

export default Modal;
