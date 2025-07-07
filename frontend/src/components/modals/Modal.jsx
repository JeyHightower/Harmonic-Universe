import PropTypes from 'prop-types';
import { forwardRef, useEffect, useRef, useState } from 'react';
import '../../styles/Modal.css';
import ModalPortal from './ModalPortal';

/**
 * Modal component that provides a consistent interface for showing modal dialogs
 */
const Modal = forwardRef(
  (
    {
      isOpen,
      onClose,
      title,
      children,
      size = 'medium',
      position = 'center',
      closeOnEscape = true,
      closeOnBackdrop = true,
      showCloseButton = true,
      className = '',
      footer = null,
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const modalRef = useRef(null);
    const previousFocus = useRef(null);
    const scrollPositionRef = useRef(0);
    const combinedRef = ref || modalRef;

    // Save previous focus and handle body scroll
    useEffect(() => {
      if (isOpen) {
        // Set inert on #root to hide from assistive tech and prevent focus
        const root = document.getElementById('root');
        if (root) root.inert = true;
        // Save previous focus for restoring later
        previousFocus.current = document.activeElement;

        // Save current scroll position
        scrollPositionRef.current = window.scrollY;

        // Lock body scroll
        document.body.classList.add('modal-open');
        document.body.style.top = `-${scrollPositionRef.current}px`;
        document.body.style.width = '100%';
        document.body.style.position = 'fixed';

        // Show modal with animation delay
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      }

      return () => {
        // Cleanup if component unmounts
        if (isOpen) {
          // Remove inert from #root
          const root = document.getElementById('root');
          if (root) root.inert = false;
          document.body.classList.remove('modal-open');
          document.body.style.top = '';
          document.body.style.position = '';
          document.body.style.width = '';

          // Restore scroll position
          window.scrollTo(0, scrollPositionRef.current);

          // Restore focus
          if (previousFocus.current) {
            previousFocus.current.focus();
          }
        }
      };
    }, [isOpen]);

    // Handle escape key press
    useEffect(() => {
      const handleEscape = (e) => {
        if (e.key === 'Escape' && isOpen && closeOnEscape) {
          handleClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, closeOnEscape]);

    // Handle closing with animation
    const handleClose = () => {
      if (!isClosing) {
        setIsClosing(true);

        // Wait for animation to complete
        setTimeout(() => {
          setIsVisible(false);
          setIsClosing(false);
          if (onClose) onClose();
        }, 200); // Match the CSS transition duration
      }
    };

    // Handle backdrop click
    const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget && closeOnBackdrop) {
        handleClose();
      }
    };

    // Prevent click events from bubbling to parent elements
    const handleContentClick = (e) => {
      e.stopPropagation();
    };

    if (!isOpen && !isClosing) {
      return null;
    }

    // Generate size classes
    const sizeClass =
      {
        small: 'modal-small',
        medium: 'modal-medium',
        large: 'modal-large',
        xlarge: 'modal-xlarge',
      }[size] || 'modal-medium';

    // Generate position classes
    const positionClass =
      {
        center: 'modal-center',
        top: 'modal-top',
        bottom: 'modal-bottom',
        left: 'modal-left',
        right: 'modal-right',
      }[position] || 'modal-center';

    return (
      <ModalPortal>
        <div
          className={`modal-backdrop ${isVisible ? 'visible' : ''} ${isClosing ? 'closing' : ''}`}
          onClick={handleBackdropClick}
        >
          <div
            ref={combinedRef}
            className={`modal modal-${size} modal-position-${position} ${className} ${isVisible ? 'showing' : ''} ${isClosing ? 'closing' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={handleContentClick}
          >
            <div className="modal-content-wrapper">
              <div className="modal-header">
                {title && (
                  <h3 id="modal-title" className="modal-title">
                    {title}
                  </h3>
                )}
                {showCloseButton && (
                  <button
                    type="button"
                    className="modal-close"
                    aria-label="Close"
                    onClick={handleClose}
                  >
                    &times;
                  </button>
                )}
              </div>
              <div className="modal-body">{children}</div>
              {footer && <div className="modal-footer">{footer}</div>}
            </div>
          </div>
        </div>
      </ModalPortal>
    );
  }
);

Modal.displayName = 'Modal';

Modal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'fullscreen']),
  position: PropTypes.oneOf(['center', 'top', 'right', 'bottom', 'left']),
  closeOnEscape: PropTypes.bool,
  closeOnBackdrop: PropTypes.bool,
  showCloseButton: PropTypes.bool,
  className: PropTypes.string,
  footer: PropTypes.node,
};

export default Modal;
