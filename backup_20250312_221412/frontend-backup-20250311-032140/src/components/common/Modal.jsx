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
import '../../styles/modal.css';

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
    // Add a ref to track if the modal has been mounted
    const mountedRef = useRef(false);
    // Add a ref to track when the modal was opened
    const openedAtRef = useRef(Date.now());
    // Add a ref to store the portal element
    const portalElementRef = useRef(null);

    // Use the forwarded ref if provided, otherwise use our internal ref
    const combinedRef = ref || modalRef;

    // Function to force the modal to stay visible
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

      // Check if closing is allowed based on timing
      if (preventAutoClose) {
        console.log(
          'Modal has preventAutoClose set - checking if closing should be allowed'
        );

        // Absolute time-based prevention
        const openedAt = openedAtRef.current;
        const now = Date.now();
        const timeOpen = now - openedAt;

        console.log(`Modal has been open for ${timeOpen}ms`);

        // Strong protection: force modal to stay open for at least 60 seconds for universe-create modals
        const minTimeOpen = dataModalType === 'universe-create' ? 60000 : 30000;

        if (timeOpen < minTimeOpen) {
          console.warn(
            `Modal tried to close too soon after opening (${timeOpen}ms), preventing close. Minimum time: ${minTimeOpen}ms`
          );
          forceModalVisible();
          return;
        }

        // Check the data attributes that might have been set by the modal component
        const mountedAtStr = modalRef.current?.getAttribute('data-mounted-at');
        if (mountedAtStr) {
          const mountedAt = parseInt(mountedAtStr, 10);
          const now = Date.now();
          const timeOpen = now - mountedAt;

          console.log(`Modal component has been mounted for ${timeOpen}ms`);

          // Prevent closing if the modal component was just mounted
          if (timeOpen < minTimeOpen) {
            console.warn(
              `Modal component mounted too recently (${timeOpen}ms), preventing close. Minimum time: ${minTimeOpen}ms`
            );
            forceModalVisible();
            return;
          }
        }
      }

      // Extra protection check - don't allow closing if explicitly prevented
      const preventClose = modalRef.current?.getAttribute('data-prevent-close');
      if (preventClose === 'true') {
        console.log(
          'Modal has explicit close prevention active - ignoring close request'
        );
        forceModalVisible();
        return;
      }

      // Check if this is a user-initiated close
      const closeReason = modalRef.current?.getAttribute('data-close-reason');
      if (!closeReason || closeReason !== 'user-action') {
        console.warn(
          'Modal close not initiated by user action, preventing close'
        );
        forceModalVisible();
        return;
      }

      if (!isClosing) {
        setIsClosing(true);

        // Add a longer delay before actually triggering onClose
        setTimeout(() => {
          if (onClose) {
            console.log('Calling modal onClose function after animation delay');
            onClose();
          }
          setIsClosing(false);
        }, 500); // Increased from 300ms to 500ms - should match the CSS transition duration
      }
    }, [
      isClosing,
      onClose,
      preventAutoClose,
      forceModalVisible,
      dataModalType,
    ]);

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

    // Effect to handle opening and closing states
    useEffect(() => {
      console.log('Modal useEffect triggered, isOpen:', isOpen);

      // Declare originalStyles in this scope
      let originalStyles = {};

      if (isOpen) {
        console.log('Modal is opening');

        // Set the mounted flag
        mountedRef.current = true;

        // Store when the modal was opened
        openedAtRef.current = Date.now();

        // Prevent modal from being closed too soon after opening
        modalRef.current?.setAttribute(
          'data-opened-at',
          openedAtRef.current.toString()
        );

        // Extra protection logic for new modals
        modalRef.current?.setAttribute('data-prevent-close', 'true');

        // Add modal type attribute if provided
        if (dataModalType) {
          modalRef.current?.setAttribute('data-modal-type', dataModalType);
        }

        // Add modal ID attribute if provided
        if (dataModalId) {
          modalRef.current?.setAttribute('data-modal-id', dataModalId);
        }

        // Create a MutationObserver to detect and prevent DOM removal
        const observer = new MutationObserver(mutations => {
          mutations.forEach(mutation => {
            if (
              mutation.type === 'childList' &&
              mutation.removedNodes.length > 0
            ) {
              for (let i = 0; i < mutation.removedNodes.length; i++) {
                const node = mutation.removedNodes[i];
                if (
                  node === portalElementRef.current ||
                  (node.contains && node.contains(portalElementRef.current))
                ) {
                  console.error('Detected attempt to remove modal from DOM!');

                  // Try to re-add the node
                  try {
                    mutation.target.appendChild(node);
                    console.log('Successfully restored modal to DOM');
                  } catch (e) {
                    console.error('Failed to restore modal:', e);

                    // Try to dispatch a reopen event
                    try {
                      window.dispatchEvent(
                        new CustomEvent('modal:reopen', {
                          detail: {
                            modalType: dataModalType || 'universe-create',
                            forceReopen: true,
                            timestamp: Date.now(),
                            isRetry: true,
                          },
                        })
                      );
                    } catch (e) {
                      console.error('Failed to dispatch reopen event:', e);
                    }
                  }
                }
              }
            }
          });
        });

        // Start observing with configuration
        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });

        // Only remove the protection after a timeout
        // Use a longer timeout for universe-create modals
        const protectionTimeout = setTimeout(
          () => {
            if (modalRef.current) {
              console.log(
                'Modal protection timeout complete - allowing normal close functionality'
              );
              modalRef.current.setAttribute('data-prevent-close', 'false');
            }
          },
          dataModalType === 'universe-create' ? 60000 : 30000
        );

        // Store previous focus
        previousFocus.current = document.activeElement;

        // Increment modal stack count
        modalStackCount++;
        setStackLevel(modalStackCount);

        // Only modify body if this is the first modal in the stack
        if (modalStackCount === 1) {
          // Store original body styles
          scrollY = window.scrollY;
          originalStyles = {
            position: document.body.style.position,
            top: document.body.style.top,
            width: document.body.style.width,
            overflow: document.body.style.overflow,
          };

          // Apply modal open styles to body
          document.body.classList.add('modal-open');
          document.body.style.position = 'fixed';
          document.body.style.top = `-${scrollY}px`;
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

        // Add a DOM-level protection to prevent the modal from being removed
        const protectInterval = setInterval(() => {
          if (modalRef.current) {
            forceModalVisible();
          }
        }, 100);

        // Dispatch an event to notify the system that the modal is mounted
        try {
          window.dispatchEvent(
            new CustomEvent('modal:mounted', {
              detail: {
                modalType: dataModalType || 'unknown',
                modalId: dataModalId || modalId.current,
                timestamp: Date.now(),
              },
            })
          );
        } catch (e) {
          console.error('Failed to dispatch modal:mounted event:', e);
        }

        return () => {
          clearTimeout(protectionTimeout);
          clearInterval(protectInterval);
          observer.disconnect();
        };
      }

      return () => {
        if (isOpen) {
          // Check if the modal hasn't been open long enough
          const openedAt = openedAtRef.current;
          const now = Date.now();
          const timeOpen = now - openedAt;

          // Use a longer minimum time for universe-create modals
          const minTimeOpen =
            dataModalType === 'universe-create' ? 60000 : 30000;

          console.log(`Modal has been open for ${timeOpen}ms`);

          // If modal has been open for less than the minimum time, it might be closing too soon
          if (timeOpen < minTimeOpen) {
            console.warn(
              `Modal is closing too quickly after opening! ${timeOpen}ms < ${minTimeOpen}ms`
            );

            // Try to dispatch a reopen event
            try {
              window.dispatchEvent(
                new CustomEvent('modal:reopen', {
                  detail: {
                    modalType: dataModalType || 'universe-create',
                    forceReopen: true,
                    timestamp: Date.now(),
                    isRetry: true,
                  },
                })
              );
            } catch (e) {
              console.error('Failed to dispatch reopen event:', e);
            }

            // Don't allow closing if it's too soon - this will prevent the cleanup
            return;
          }

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
          event.preventDefault();

          // Mark this as a user-initiated close
          if (modalRef.current) {
            modalRef.current.setAttribute('data-close-reason', 'user-action');
          }

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
          // Mark this as a user-initiated close
          if (modalRef.current) {
            modalRef.current.setAttribute('data-close-reason', 'user-action');
          }

          handleClose();
        }
      },
      [handleClose, isClosing, preventBackdropClick]
    );

    if (!isOpen) {
      console.log('Modal component returning null because isOpen is false');
      return null;
    }
    console.log('Modal rendering with isOpen:', isOpen);

    // Determine modal classes
    const modalClasses = [
      'modal',
      size, // Updated to use new class names
      type !== 'default' ? `modal-${type}` : '',
      isClosing ? 'closing' : 'open',
      contentClassName,
    ]
      .filter(Boolean)
      .join(' ');

    // Determine container classes
    const containerClasses = [
      'modal-container',
      position !== 'center' ? position : '',
      isOpen && !isClosing ? 'open' : '',
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

    // Add data attributes
    const dataAttributes = {
      'data-modal-id': dataModalId || modalId.current,
      'data-stack-level': stackLevel,
      'data-opened-at': openedAtRef.current,
      'data-prevent-close': 'true',
    };

    if (dataModalType) {
      dataAttributes['data-modal-type'] = dataModalType;
    }

    const modalContent = (
      <div
        className={containerClasses}
        onClick={handleOverlayClick}
        style={{
          zIndex: 9999 + stackLevel,
        }}
        ref={node => {
          portalElementRef.current = node;
          if (combinedRef) {
            if (typeof combinedRef === 'function') {
              combinedRef(node);
            } else {
              combinedRef.current = node;
            }
          }
        }}
        {...ariaAttributes}
        {...dataAttributes}
      >
        <div className="modal-backdrop" onClick={handleOverlayClick}></div>
        <div ref={modalRef} className={modalClasses} tabIndex={-1}>
          <div className="modal-header">
            <h2 id={titleId} className="modal-title">
              {title}
            </h2>
            {showCloseButton && (
              <button
                type="button"
                className="modal-close"
                onClick={() => {
                  // Mark this as a user-initiated close
                  if (modalRef.current) {
                    modalRef.current.setAttribute(
                      'data-close-reason',
                      'user-action'
                    );
                  }
                  handleClose();
                }}
                aria-label="Close modal"
              >
                ×
              </button>
            )}
          </div>
          <div id={contentId} className="modal-content" ref={contentRef}>
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
  preventAutoClose: PropTypes.bool,
  'data-modal-id': PropTypes.string,
  'data-modal-type': PropTypes.string,
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
  preventAutoClose: false,
  'data-modal-id': '',
  'data-modal-type': '',
};

export default Modal;
