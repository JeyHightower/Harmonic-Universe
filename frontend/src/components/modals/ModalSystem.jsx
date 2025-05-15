import PropTypes from 'prop-types';
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/Modal.css';
import { MODAL_CONFIG } from '../../utils/config';
import { applyElementModalFixes, ensurePortalRoot } from '../../utils/portalUtils';

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

        // Apply fixes to ensure modal interaction works
        setTimeout(() => {
          if (modalRef.current) {
            applyElementModalFixes(modalRef.current);
          }
        }, 0);
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

    // Focus handling and body scroll locking
    useEffect(() => {
      if (isOpen && !isClosing) {
        // Save previous focus
        previousFocus.current = document.activeElement;

        // Track modal stack
        const level = modalStack.increment();
        setStackLevel(level);

        // Lock body scroll
        if (preventBodyScroll) {
          modalStack.lockBodyScroll();
        }

        // Set focus to initial element or modal
        if (initialFocusRef && initialFocusRef.current) {
          initialFocusRef.current.focus();
        } else if (contentRef.current) {
          contentRef.current.focus();
        }

        // Apply modal fixes after a short delay to ensure DOM is ready
        setTimeout(() => {
          if (modalRef.current) {
            applyElementModalFixes(modalRef.current);
          }
        }, 50);
      }

      return () => {
        if (isOpen && !isClosing) {
          // Decrement modal stack
          const remainingModals = modalStack.decrement();

          // Restore body scroll if no modals left
          if (remainingModals === 0 && preventBodyScroll) {
            modalStack.unlockBodyScroll();
          }

          // Restore previous focus
          if (previousFocus.current) {
            previousFocus.current.focus();
          }
        }
      };
    }, [isOpen, isClosing, initialFocusRef, preventBodyScroll]);

    // Handle form field interaction
    const handleFormFieldInteraction = useCallback((e) => {
      // Prevent default behavior to ensure form fields work correctly
      e.preventDefault();
      // Stop propagation to prevent backdrop click from closing modal
      e.stopPropagation();

      // Handle focus for form elements
      const target = e.target;
      const tagName = target.tagName.toLowerCase();

      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        // Focus the element immediately and directly
        target.focus();

        // Ensure proper styling
        target.style.pointerEvents = 'auto';
        target.style.zIndex = '10002';
        target.style.position = 'relative';

        console.log(`Input field focused: ${target.name || target.id || target.className}`);
      }

      // Handle buttons
      if (
        tagName === 'button' ||
        target.getAttribute('role') === 'button' ||
        target.classList.contains('btn') ||
        target.classList.contains('button')
      ) {
        target.style.pointerEvents = 'auto';
        target.style.cursor = 'pointer';
        target.style.zIndex = '100';
      }

      // Special handling for auth buttons
      if (
        target.classList.contains('logout-button') ||
        target.classList.contains('login-button') ||
        target.classList.contains('signup-button') ||
        target.getAttribute('data-action') === 'logout'
      ) {
        target.style.zIndex = '1000';
        console.log('Auth button interaction:', target.textContent);
      }
    }, []);

    if (!isOpen && !isClosing) {
      return null;
    }

    // Get appropriate modal styles
    const modalStyles = {
      width: size,
      transform: isDragging ? `translate(${dragPosition.x}px, ${dragPosition.y}px)` : undefined,
    };

    // Determine position class
    const positionClass =
      position && position !== MODAL_CONFIG.POSITIONS.CENTER ? `modal-position-${position}` : '';

    // Combine class names
    const combinedClassName = `modal modal-${type} ${className} ${positionClass} modal-animation-${animation} ${
      isClosing ? 'closing' : ''
    }`;

    const modalContent = (
      <div
        className="modal-backdrop"
        onClick={handleBackdropClick}
        data-modal-id={dataModalId || modalId}
        data-modal-type={dataModalType || type}
        style={{
          pointerEvents: 'auto',
          position: 'fixed',
        }}
      >
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={ariaDescribedBy || contentId}
          className={combinedClassName}
          style={modalStyles}
          onMouseDown={handleMouseDown}
          onClick={(e) => e.stopPropagation()} // Stop propagation to prevent backdrop clicks
          tabIndex={-1}
          data-testid="modal-dialog"
        >
          <div
            className="modal-content-wrapper"
            style={{
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: '2',
            }}
          >
            <div className="modal-header">
              <h2 id={titleId} className="modal-title">
                {title}
              </h2>
              {showCloseButton && (
                <button
                  type="button"
                  className="modal-close"
                  aria-label="Close"
                  onClick={handleClose}
                  data-testid="modal-close"
                  style={{
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    zIndex: '1060',
                  }}
                >
                  &times;
                </button>
              )}
            </div>

            <div
              ref={contentRef}
              id={contentId}
              className="modal-body"
              onMouseDown={handleFormFieldInteraction}
              onTouchStart={handleFormFieldInteraction}
              style={{
                pointerEvents: 'auto',
                position: 'relative',
                zIndex: '2',
              }}
            >
              {children}
            </div>

            {footerContent && <div className="modal-footer">{footerContent}</div>}
          </div>
        </div>
      </div>
    );

    return createPortal(modalContent, portalElementRef.current || portalRoot);
  }
);

ModalSystem.displayName = 'ModalSystem';

ModalSystem.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  type: PropTypes.string,
  animation: PropTypes.string,
  position: PropTypes.string,
  showCloseButton: PropTypes.bool,
  preventBackdropClick: PropTypes.bool,
  className: PropTypes.string,
  footerContent: PropTypes.node,
  ariaDescribedBy: PropTypes.string,
  initialFocusRef: PropTypes.shape({ current: PropTypes.any }),
  preventAutoClose: PropTypes.bool,
  draggable: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
  closeOnBackdrop: PropTypes.bool,
  preventBodyScroll: PropTypes.bool,
  'data-modal-id': PropTypes.string,
  'data-modal-type': PropTypes.string,
};

export default ModalSystem;
