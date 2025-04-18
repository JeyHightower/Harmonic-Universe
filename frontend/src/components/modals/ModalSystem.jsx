import PropTypes from 'prop-types';
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/Modal.css';
import { MODAL_CONFIG } from '../../utils/config';

// Define window globals to fix ESLint errors
const { requestAnimationFrame, clearTimeout } = window;

// Animation duration in ms
const ANIMATION_DURATION = MODAL_CONFIG.ANIMATIONS.FADE.duration;

// Shared modal stack counter to handle multiple modals
let modalStackCount = 0;
let scrollY = 0;

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
    console.log(`ModalSystem - Component called with isOpen=${isOpen}, title=${title}`);

    const modalRef = useRef(null);
    const contentRef = useRef(null);
    const previousFocus = useRef(null);
    const [isClosing, setIsClosing] = useState(false);
    const [stackLevel, setStackLevel] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
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
        if (portalElementRef.current?.parentElement) {
          portalElementRef.current.parentElement.removeChild(portalElementRef.current);
        }
      };
    }, []);

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
        e.preventDefault();
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

      // Set a timeout to match animation duration
      setTimeout(() => {
        if (onClose && typeof onClose === 'function') {
          onClose();
        }
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
          // Prevent event from bubbling
          e.preventDefault();
          e.stopPropagation();
          handleClose();
        }
      },
      [preventBackdropClick, closeOnBackdrop, handleClose]
    );

    // Handle modal open/close state
    useEffect(() => {
      console.log(`ModalSystem - useEffect triggered with isOpen=${isOpen}, title=${title}`);

      if (isOpen) {
        console.log(`ModalSystem - Opening modal: ${title}`);
        console.log(`ModalSystem - Portal root:`, portalRoot);
        console.log(`ModalSystem - Portal element:`, portalElementRef.current);

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
            modalRef.current.setAttribute('data-prevent-close', 'false');
          }
        }, 500);

        previousFocus.current = document.activeElement;
        modalStackCount++;
        setStackLevel(modalStackCount);

        if (modalStackCount === 1) {
          scrollY = window.scrollY;
          document.body.classList.add('modal-open');
          document.body.style.position = 'fixed';
          document.body.style.top = `-${scrollY}px`;
          document.body.style.width = '100%';
          document.body.style.overflow = 'hidden';
        }

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

        return () => {
          clearTimeout(protectionTimeout);
        };
      } else {
        setIsClosing(false);
        mountedRef.current = false;
        modalStackCount--;
        if (modalStackCount === 0) {
          document.body.classList.remove('modal-open');
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.width = '';
          document.body.style.overflow = '';
          window.scrollTo(0, scrollY);
        }
      }
    }, [isOpen, initialFocusRef, dataModalType, dataModalId]);

    if (!isOpen) return null;

    const modalContent = (
      <div
        ref={combinedRef}
        id={modalId.current}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={ariaDescribedBy || contentId}
        className={`modal-overlay ${isClosing ? 'closing' : ''}`}
        style={{ zIndex: 1000 + stackLevel }}
        tabIndex="-1"
        data-testid="modal"
        data-mounted-at={Date.now().toString()}
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
          style={{
            transform: draggable
              ? `translate(${dragPosition.x}px, ${dragPosition.y}px)`
              : undefined,
          }}
        >
          <div className="modal-header" onMouseDown={draggable ? handleMouseDown : undefined}>
            <h2 id={titleId} className="modal-title">
              {title}
            </h2>
            {showCloseButton && (
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={handleClose}
                data-testid="modal-close-button"
              >
                &times;
              </button>
            )}
          </div>
          <div id={contentId} className="modal-body">
            {children}
          </div>
          {footerContent && <div className="modal-footer">{footerContent}</div>}
        </div>
      </div>
    );

    return portalElementRef.current ? createPortal(modalContent, portalRoot) : null;
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
