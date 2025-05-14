import PropTypes from 'prop-types';
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/Modal.css';
import { MODAL_CONFIG } from '../../utils/config';
import { ensurePortalRoot } from '../../utils/portalUtils';

// Animation duration in ms
const ANIMATION_DURATION = MODAL_CONFIG.ANIMATIONS.FADE.duration;

// Shared modal stack management with a more robust approach
const modalStack = {
  count: 0,
  scrollPosition: 0,
  increment() {
    this.count += 1;
    return this.count;
  },
  decrement() {
    if (this.count > 0) {
      this.count -= 1;
    }
    return this.count;
  },
  saveScrollPosition() {
    this.scrollPosition = window.scrollY;
  },
  restoreScrollPosition() {
    window.scrollTo(0, this.scrollPosition);
  },
  lockBodyScroll() {
    if (this.count === 1) {
      this.saveScrollPosition();
      document.body.classList.add('modal-open');
      document.body.style.position = 'fixed';
      document.body.style.top = `-${this.scrollPosition}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    }
  },
  unlockBodyScroll() {
    if (this.count === 0) {
      document.body.classList.remove('modal-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      this.restoreScrollPosition();
    }
  },
};

/**
 * Generate a unique ID with an optional prefix
 */
const useGenerateId = (prefix = 'id') => {
  return useMemo(() => `${prefix}-${Math.random().toString(36).substr(2, 9)}`, [prefix]);
};

const ModalSystem = forwardRef(
  (
    {
      isOpen,
      onClose,
      title = 'Modal',
      children,
      size = MODAL_CONFIG.SIZES.MEDIUM,
      type = MODAL_CONFIG.TYPES.DEFAULT,
      animation = MODAL_CONFIG.ANIMATIONS.FADE,
      position = MODAL_CONFIG.POSITIONS.CENTER,
      showCloseButton = MODAL_CONFIG.DEFAULT_SETTINGS.showCloseButton,
      preventBackdropClick = false,
      className = '',
      footerContent = null,
      ariaDescribedBy = '',
      initialFocusRef = null,
      preventAutoClose = false,
      draggable = MODAL_CONFIG.DEFAULT_SETTINGS.draggable,
      closeOnEscape = MODAL_CONFIG.DEFAULT_SETTINGS.closeOnEscape,
      closeOnBackdrop = MODAL_CONFIG.DEFAULT_SETTINGS.closeOnBackdrop,
      preventBodyScroll = MODAL_CONFIG.DEFAULT_SETTINGS.preventBodyScroll,
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
    const [isDragging, setIsDragging] = useState(false);
    const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const portalRoot = document.getElementById('portal-root') || document.body;
    const modalId = useGenerateId('modal');
    const titleId = `${modalId}-title`;
    const contentId = `${modalId}-content`;
    const mountedRef = useRef(false);
    const closeTimeoutRef = useRef(null);
    const portalElementRef = useRef(null);

    // Create portal element once during component initialization
    useEffect(() => {
      // Use the shared portalUtils to ensure consistent portal root
      ensurePortalRoot();

      const modalPortal = document.createElement('div');
      modalPortal.classList.add('modal-portal');
      modalPortal.setAttribute('data-modal-id', modalId);
      modalPortal.style.pointerEvents = 'auto';
      portalElementRef.current = modalPortal;

      if (isOpen) {
        // Only append to DOM when modal is open
        portalRoot.appendChild(modalPortal);
      }

      return () => {
        if (portalElementRef.current?.parentElement) {
          portalElementRef.current.parentElement.removeChild(portalElementRef.current);
        }
      };
    }, [isOpen, portalRoot, modalId]);

    const combinedRef = ref || modalRef;

    const handleMouseDown = useCallback(
      (e) => {
        if (!draggable || !e.target.closest('.modal-header')) return;

        setIsDragging(true);
        if (modalRef.current) {
          const modalRect = modalRef.current.getBoundingClientRect();
          setDragOffset({
            x: e.clientX - modalRect.left - dragPosition.x,
            y: e.clientY - modalRect.top - dragPosition.y,
          });
        }
      },
      [draggable, dragPosition]
    );

    const handleMouseMove = useCallback(
      (e) => {
        if (!isDragging) return;

        setDragPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      },
      [isDragging, dragOffset]
    );

    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
    }, []);

    const handleClose = useCallback(() => {
      if (isClosing) return;
      setIsClosing(true);

      // Clear any existing timeout to prevent memory leaks
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }

      // Set a timeout to match animation duration
      closeTimeoutRef.current = setTimeout(() => {
        if (onClose && typeof onClose === 'function') {
          onClose();
        }
        setIsClosing(false); // Reset closing state to ensure clean state for next open
      }, ANIMATION_DURATION);
    }, [isClosing, onClose]);

    // Handle ESC key press
    useEffect(() => {
      const handleEscape = (event) => {
        if (event.key === 'Escape' && isOpen && !isClosing && closeOnEscape) {
          handleClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, isClosing, handleClose, closeOnEscape]);

    // Handle backdrop click
    const handleBackdropClick = useCallback(
      (e) => {
        // Only process if we're clicking directly on the backdrop
        if (e.target === e.currentTarget && !preventBackdropClick && closeOnBackdrop) {
          handleClose();
        }
      },
      [preventBackdropClick, closeOnBackdrop, handleClose]
    );

    // Handle content click to prevent it from propagating to backdrop
    const handleContentClick = useCallback((e) => {
      // Prevent event from bubbling to parent elements like backdrop
      e.stopPropagation();
    }, []);

    // Handle global event listeners for drag functionality
    useEffect(() => {
      if (draggable && isOpen) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
      }
      return undefined;
    }, [draggable, isOpen, handleMouseMove, handleMouseUp]);

    // Handle modal open/close state and body scroll locking
    useEffect(() => {
      if (isOpen) {
        mountedRef.current = true;

        // Set data attributes for easier debugging and testing
        if (modalRef.current) {
          if (dataModalType) {
            modalRef.current.setAttribute('data-modal-type', dataModalType);
          }
          if (dataModalId) {
            modalRef.current.setAttribute('data-modal-id', dataModalId);
          }
        }

        // Save the current active element to restore focus later
        previousFocus.current = document.activeElement;

        // Update modal stack and set stack level for z-index
        const level = modalStack.increment();
        setStackLevel(level);

        // Lock body scroll if this is the first modal
        if (preventBodyScroll) {
          modalStack.lockBodyScroll();
        }

        // Focus the first focusable element
        requestAnimationFrame(() => {
          if (initialFocusRef?.current) {
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
      } else {
        // Reset state when closed
        setIsClosing(false);
        mountedRef.current = false;

        // Update modal stack and unlock body if needed
        modalStack.decrement();
        if (preventBodyScroll) {
          modalStack.unlockBodyScroll();
        }
      }

      // Cleanup on unmount or when isOpen changes
      return () => {
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
        }
      };
    }, [isOpen, preventBodyScroll, initialFocusRef, dataModalType, dataModalId]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        // Ensure body scroll is unlocked if component unmounts while open
        if (isOpen && mountedRef.current) {
          modalStack.decrement();
          if (preventBodyScroll) {
            modalStack.unlockBodyScroll();
          }
        }

        // Return focus to previous element
        if (previousFocus.current) {
          previousFocus.current.focus();
        }

        // Clear any pending timeouts
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
        }
      };
    }, [isOpen, preventBodyScroll]);

    if (!isOpen) return null;

    const modalContent = (
      <div
        ref={combinedRef}
        id={modalId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={ariaDescribedBy || contentId}
        className={`modal-overlay ${isClosing ? 'closing' : ''}`}
        style={{ zIndex: 1050 + stackLevel }}
        tabIndex="-1"
        data-testid="modal"
      >
        <div
          className="modal-backdrop"
          onClick={handleBackdropClick}
          data-testid="modal-backdrop"
        />
        <div
          className={`modal-content modal-${size} modal-${type} modal-${position} ${
            animation !== MODAL_CONFIG.ANIMATIONS.NONE ? `modal-animation-${animation}` : ''
          } ${isClosing ? 'closing' : ''} ${isDragging ? 'dragging' : ''} ${className || ''}`}
          ref={contentRef}
          onClick={handleContentClick}
          style={{
            transform: draggable
              ? `translate(${dragPosition.x}px, ${dragPosition.y}px)`
              : undefined,
          }}
        >
          <div
            className="modal-header"
            onMouseDown={draggable ? handleMouseDown : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id={titleId} className="modal-title">
              {title}
            </h2>
            {showCloseButton && (
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                data-testid="modal-close-button"
              >
                &times;
              </button>
            )}
          </div>
          <div id={contentId} className="modal-body" onClick={(e) => e.stopPropagation()}>
            {children}
          </div>
          {footerContent && (
            <div className="modal-footer" onClick={(e) => e.stopPropagation()}>
              {footerContent}
            </div>
          )}
        </div>
      </div>
    );

    // Create portal to render modal outside component hierarchy
    return portalElementRef.current ? createPortal(modalContent, portalElementRef.current) : null;
  }
);

ModalSystem.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node,
  size: PropTypes.oneOf(Object.values(MODAL_CONFIG.SIZES)),
  type: PropTypes.oneOf(Object.values(MODAL_CONFIG.TYPES)),
  animation: PropTypes.oneOf(Object.values(MODAL_CONFIG.ANIMATIONS)),
  position: PropTypes.oneOf(Object.values(MODAL_CONFIG.POSITIONS)),
  showCloseButton: PropTypes.bool,
  preventBackdropClick: PropTypes.bool,
  className: PropTypes.string,
  footerContent: PropTypes.node,
  ariaDescribedBy: PropTypes.string,
  initialFocusRef: PropTypes.object,
  preventAutoClose: PropTypes.bool,
  draggable: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
  closeOnBackdrop: PropTypes.bool,
  preventBodyScroll: PropTypes.bool,
  'data-modal-id': PropTypes.string,
  'data-modal-type': PropTypes.string,
};

ModalSystem.displayName = 'ModalSystem';

export default ModalSystem;
