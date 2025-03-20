import PropTypes from 'prop-types';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import '../styles/modal.css';

// Animation duration in ms
const ANIMATION_DURATION = 300;

// Shared modal stack counter to handle multiple modals
let modalStackCount = 0;
let scrollY = 0; // Define scrollY at the module level

/**
 * Generate a unique ID with an optional prefix
 */
const useGenerateId = (prefix = 'id') => {
  return useMemo(
    () => `${prefix}-${Math.random().toString(36).substr(2, 9)}`,
    [prefix]
  );
};

// The getModalComponent function has been moved to ModalUtils.jsx

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
      preventAutoClose = false,
      'data-modal-id': dataModalId,
      'data-modal-type': dataModalType,
    },
    ref
  ) => {
    const modalRef = useRef(null);
    const contentRef = useRef(null);
    const previousFocus = useRef(null);
    const [isClosing, setIsClosing] = useState(false);
    const [stackLevel, setStackLevel] = useState(0);
    const portalRoot = document.getElementById('portal-root') || document.body;
    const modalId = useRef(`modal-${Math.random().toString(36).substr(2, 9)}`);
    const titleId = `${modalId.current}-title`;
    const contentId = `${modalId.current}-content`;
    const mountedRef = useRef(false);
    const openedAtRef = useRef(Date.now());
    const portalElementRef = useRef(null);

    // Create portal element once during component initialization
    useEffect(() => {
      const modalPortal = document.createElement('div');
      modalPortal.classList.add('modal-portal');
      portalElementRef.current = modalPortal;
      return () => {
        // Clean up the portal element if it's still in the DOM
        if (portalElementRef.current && portalElementRef.current.parentElement) {
          portalElementRef.current.parentElement.removeChild(portalElementRef.current);
        }
      };
    }, []); // Empty dependency array - only run once on mount

    const combinedRef = ref || modalRef;

    const forceModalVisible = useCallback(() => {
      if (modalRef.current) {
        modalRef.current.style.display = 'block';
        modalRef.current.style.visibility = 'visible';
        modalRef.current.style.opacity = '1';
        modalRef.current.style.zIndex = '9999';
        modalRef.current.classList.add('force-visible');
      }
    }, []);

    const handleClose = useCallback(() => {
      console.log('Modal handleClose function called');

      if (preventAutoClose) {
        const openedAt = openedAtRef.current;
        const now = Date.now();
        const timeOpen = now - openedAt;

        console.log(`Modal has been open for ${timeOpen}ms`);
      }

      if (!isClosing) {
        setIsClosing(true);
        setTimeout(() => {
          if (onClose) {
            console.log('Calling modal onClose function after animation delay');
            onClose();
          }
          setIsClosing(false);
        }, 300);
      }
    }, [
      isClosing,
      onClose,
      preventAutoClose,
    ]);

    useEffect(() => {
      if (!isOpen || !modalRef.current) return;

      const modalElement = modalRef.current;

      const focusableElements = modalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleTabKey = e => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
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

    useEffect(() => {
      console.log('Modal useEffect triggered, isOpen:', isOpen);

      let originalStyles = {};

      if (isOpen) {
        console.log('Modal is opening');

        mountedRef.current = true;
        openedAtRef.current = Date.now();
        modalRef.current?.setAttribute('data-opened-at', openedAtRef.current.toString());
        modalRef.current?.setAttribute('data-prevent-close', 'false');

        if (dataModalType) {
          modalRef.current?.setAttribute('data-modal-type', dataModalType);
        }

        if (dataModalId) {
          modalRef.current?.setAttribute('data-modal-id', dataModalId);
        }

        const protectionTimeout = setTimeout(() => {
          if (modalRef.current) {
            console.log('Modal protection timeout complete - allowing normal close functionality');
            modalRef.current.setAttribute('data-prevent-close', 'false');
          }
        }, 500);

        previousFocus.current = document.activeElement;
        modalStackCount++;
        setStackLevel(modalStackCount);

        if (modalStackCount === 1) {
          scrollY = window.scrollY;
          originalStyles = {
            position: document.body.style.position,
            top: document.body.style.top,
            width: document.body.style.width,
            overflow: document.body.style.overflow,
          };

          document.body.classList.add('modal-open');
          document.body.style.position = 'fixed';
          document.body.style.top = `-${scrollY}px`;
          document.body.style.width = '100%';
          document.body.style.overflow = 'hidden';
        }

        requestAnimationFrame(() => {
          if (initialFocusRef && initialFocusRef.current) {
            initialFocusRef.current.focus();
          } else if (modalRef.current) {
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

        try {
          window.dispatchEvent(new CustomEvent('modal:mounted', {
            detail: {
              modalType: dataModalType || 'unknown',
              modalId: dataModalId || modalId.current,
              timestamp: Date.now(),
            },
          }));
        } catch (e) {
          console.error('Failed to dispatch modal:mounted event:', e);
        }

        return () => {
          clearTimeout(protectionTimeout);
        };
      }

      return () => {
        if (isOpen) {
          const openedAt = openedAtRef.current;
          const now = Date.now();
          const timeOpen = now - openedAt;

          console.log(`Modal has been open for ${timeOpen}ms`);

          modalStackCount--;

          if (modalStackCount === 0) {
            document.body.classList.remove('modal-open');
            document.body.style.position = originalStyles.position || '';
            document.body.style.top = originalStyles.top || '';
            document.body.style.width = originalStyles.width || '';
            document.body.style.overflow = originalStyles.overflow || '';
            window.scrollTo(0, scrollY);
          }

          if (previousFocus.current) {
            previousFocus.current.focus();
            previousFocus.current = null;
          }
        }
      };
    }, [
      isOpen,
      initialFocusRef,
      dataModalType,
      dataModalId,
      forceModalVisible,
    ]);

    // Handle ESC key press
    useEffect(() => {
      const handleEscape = event => {
        if (event.key === 'Escape' && isOpen && !isClosing) {
          // Mark this close as initiated by user action
          if (modalRef.current) {
            modalRef.current.setAttribute('data-close-reason', 'user-action');
          }
          handleClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }, [isOpen, isClosing, handleClose]);

    // If not open and not closing, don't render
    if (!isOpen && !isClosing) {
      return null;
    }

    // Create the modal content
    const modalContent = (
      <div
        ref={combinedRef}
        id={modalId.current}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={ariaDescribedBy || contentId}
        className={`modal modal-${size} modal-${type} modal-${position} ${animation !== 'none' ? `modal-animation-${animation}` : ''
          } ${isClosing ? 'closing' : ''}`}
        style={{ zIndex: 1000 + stackLevel }}
        tabIndex="-1"
        data-testid="modal"
        data-mounted-at={Date.now().toString()}
      >
        <div
          className="modal-backdrop"
          onClick={preventBackdropClick ? undefined : () => {
            // Mark this close as initiated by user action
            modalRef.current?.setAttribute('data-close-reason', 'user-action');
            handleClose();
          }}
          data-testid="modal-backdrop"
        />
        <div className={`modal-container modal-${size}`} ref={contentRef}>
          <div className="modal-header">
            <h2 id={titleId} className="modal-title">
              {title}
            </h2>
            {showCloseButton && (
              <button
                type="button"
                className="modal-close-button"
                aria-label="Close"
                onClick={() => {
                  // Mark this close as initiated by user action
                  modalRef.current?.setAttribute('data-close-reason', 'user-action');
                  handleClose();
                }}
                data-testid="modal-close-button"
              >
                &times;
              </button>
            )}
          </div>
          <div id={contentId} className={`modal-content ${contentClassName}`}>
            {children}
          </div>
          {footerContent && (
            <div className="modal-footer">{footerContent}</div>
          )}
        </div>
      </div>
    );

    // Return the portal
    return portalElementRef.current ? createPortal(modalContent, portalRoot) : null;
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
  preventAutoClose: PropTypes.bool,
  'data-modal-id': PropTypes.string,
  'data-modal-type': PropTypes.string,
};

Modal.defaultProps = {
  isOpen: false,
  onClose: () => { },
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
  preventAutoClose: false,
  'data-modal-id': '',
  'data-modal-type': '',
};

export default Modal;
