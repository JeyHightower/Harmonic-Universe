import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useModal } from '../../contexts/ModalContext';
import Modal from './Modal';

// Create a stable wrapper that won't re-render and cause unmounting
const StableModalWrapper = memo(
  forwardRef(({ id, Component, props, modalProps, onClose }, ref) => {
    console.log('StableModalWrapper rendering for modal', id);

    // Remove the canUnmount state and use a ref to track mount time instead
    const mountTimeRef = useRef(Date.now());
    const modalNodeRef = useRef(null);
    const safeToUnmountRef = useRef(false);
    const unmountAttemptCountRef = useRef(0);
    const lastRenderTimeRef = useRef(Date.now());
    const isUnmountingRef = useRef(false);
    const componentPropsRef = useRef(props);
    const modalPropsRef = useRef(modalProps);
    const modalTypeRef = useRef(modalProps['data-modal-type'] || 'unknown');
    // Add a ref to track if we're in the critical mounting period
    const inCriticalPeriodRef = useRef(true);

    // Update refs when props change
    useEffect(() => {
      componentPropsRef.current = props;
      modalPropsRef.current = modalProps;
    }, [props, modalProps]);

    // Set a timer to mark the modal as safe to unmount after a delay
    useEffect(() => {
      // For universe-create modals, use a longer timeout
      const timeoutDuration =
        modalTypeRef.current === 'universe-create' ? 60000 : 30000;

      const timer = setTimeout(() => {
        safeToUnmountRef.current = true;
        inCriticalPeriodRef.current = false;
        console.log(
          `Modal ${id} is now safe to unmount after ${timeoutDuration}ms`
        );
      }, timeoutDuration);

      // Add a shorter timer to exit the critical period
      const criticalPeriodTimer = setTimeout(() => {
        inCriticalPeriodRef.current = false;
        console.log(`Modal ${id} exited critical period after 5000ms`);
      }, 5000);

      return () => {
        clearTimeout(timer);
        clearTimeout(criticalPeriodTimer);
      };
    }, [id]);

    // Helper function to safely create ISO date strings
    const safeISOString = timestamp => {
      try {
        // Handle undefined timestamp
        if (timestamp === undefined || timestamp === null) {
          // Only log a warning in development mode to reduce console noise
          if (process.env.NODE_ENV === 'development') {
            console.debug('Timestamp is undefined, using current time');
          }
          return new Date().toISOString();
        }

        // Validate the timestamp is within safe range
        if (
          timestamp &&
          typeof timestamp === 'number' &&
          timestamp > 0 &&
          timestamp < 8640000000000000
        ) {
          // Max valid JS date
          return new Date(timestamp).toISOString();
        } else {
          // Only log a warning in development mode to reduce console noise
          if (process.env.NODE_ENV === 'development') {
            console.debug(
              `Invalid timestamp: ${timestamp}, using current time`
            );
          }
          return new Date().toISOString(); // Fallback to current time
        }
      } catch (error) {
        console.error(`Error creating ISO string:`, error);
        return new Date().toISOString(); // Fallback to current time
      }
    };

    // Create a stable function reference for rendering the component
    const stableComponentRenderFn = useRef(props => {
      try {
        if (!Component) {
          console.error('No component provided for modal', id);
          return null;
        }

        // Check if Component is a React.memo component
        const isMemoComponent =
          Component &&
          typeof Component === 'object' &&
          Component.$$typeof === Symbol.for('react.memo') &&
          typeof Component.type === 'function';

        if (isMemoComponent) {
          // For memo components, we need to use the original component
          console.log(`Rendering memo component for modal ${id}`);
          return <Component.type {...props} />;
        }

        return <Component {...props} />;
      } catch (error) {
        console.error(`Error rendering component for modal ${id}:`, error);
        return <div>Error rendering modal content</div>;
      }
    });

    // Track if the component has been stabilized
    const [isStabilized, setIsStabilized] = useState(false);

    // Stabilize the component after initial render
    useEffect(() => {
      if (!isStabilized) {
        setIsStabilized(true);
      }
    }, [isStabilized]);

    // Add protection against unmounting
    useEffect(() => {
      console.log(
        `StableModalWrapper for ${id} mounted at ${safeISOString(
          mountTimeRef.current || Date.now()
        )}`
      );

      // Add a global event listener to prevent the modal from being forcibly closed
      const handleBeforeUnload = event => {
        if (!safeToUnmountRef.current) {
          event.preventDefault();
          event.returnValue = '';
          return '';
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      // Add a DOM-level protection to prevent the modal from being removed
      const protectInterval = setInterval(() => {
        if (
          modalNodeRef.current &&
          !document.body.contains(modalNodeRef.current)
        ) {
          console.warn(
            `Modal ${id} was removed from DOM, attempting to restore`
          );

          // Increment unmount attempt counter
          unmountAttemptCountRef.current++;

          // Only try to restore if we haven't exceeded the maximum attempts
          if (unmountAttemptCountRef.current <= 10) {
            // Increased from 5 to 10
            try {
              document.body.appendChild(modalNodeRef.current);
              console.log(`Successfully restored modal ${id} to DOM`);
            } catch (e) {
              console.error(`Failed to restore modal ${id} to DOM:`, e);
            }

            // Dispatch event to notify the system
            try {
              window.dispatchEvent(
                new CustomEvent('modal:reopen', {
                  detail: {
                    modalType:
                      modalProps['data-modal-type'] || 'universe-create',
                    modalId: id,
                    timestamp: Date.now(),
                  },
                })
              );
            } catch (e) {
              console.error(
                `Failed to dispatch modal:reopen event for ${id}:`,
                e
              );
            }
          }
        }

        // Also check if the modal is visible and make it visible if not
        if (modalNodeRef.current) {
          const style = window.getComputedStyle(modalNodeRef.current);
          if (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            style.opacity === '0'
          ) {
            console.log(`Modal ${id} is not visible, making it visible`);
            modalNodeRef.current.style.display = 'block';
            modalNodeRef.current.style.visibility = 'visible';
            modalNodeRef.current.style.opacity = '1';
            modalNodeRef.current.classList.add('force-visible');
          }
        }
      }, 100); // Check every 100ms

      return () => {
        try {
          console.log(`StableModalWrapper for ${id} unmounting`);

          // Check if it's safe to unmount
          if (!safeToUnmountRef.current) {
            console.warn(
              `Modal ${id} is being unmounted before it's safe! Time since mount: ${
                Date.now() - mountTimeRef.current
              }ms`
            );

            // If we're in the critical period, try harder to prevent unmounting
            if (inCriticalPeriodRef.current) {
              console.error(
                `CRITICAL: Modal ${id} is being unmounted during critical period! Attempting emergency prevention.`
              );

              // Try to force the component to stay mounted
              if (modalTypeRef.current === 'universe-create') {
                // Return false to try to prevent unmounting
                return false;
              }
            }

            // If this is a universe-create modal, try to reopen it
            if (
              modalProps['data-modal-type'] === 'universe-create' ||
              id.includes('universe-create')
            ) {
              console.warn(
                `Attempting to prevent universe-create modal ${id} from unmounting`
              );

              // Dispatch event to notify the system
              try {
                window.dispatchEvent(
                  new CustomEvent('modal:reopen', {
                    detail: {
                      modalType: 'universe-create',
                      modalId: id,
                      timestamp: Date.now(),
                      isRetry: true,
                      forceReopen: true,
                    },
                  })
                );

                // Try to prevent the unmount by returning false
                // This doesn't always work but might help in some cases
                return false;
              } catch (e) {
                console.error(
                  `Failed to dispatch modal:reopen event for ${id}:`,
                  e
                );
              }
            }
          }

          // Clean up event listeners and intervals
          window.removeEventListener('beforeunload', handleBeforeUnload);
          clearInterval(protectInterval);
        } catch (error) {
          console.error(
            `Error during StableModalWrapper cleanup for ${id}:`,
            error
          );
        }
      };
    }, [id, Component, modalProps]);

    // Enhanced props that won't change between renders
    const stableProps = useMemo(() => {
      return {
        ...props,
        onClose,
        _mountTime: mountTimeRef.current,
        _modalId: id,
        _stableRenderCount: mountTimeRef.current,
      };
    }, [id, props, onClose]);

    // Enhanced modal props that won't change between renders
    const stableModalProps = useMemo(() => {
      return {
        ...modalProps,
        onClose,
        isOpen: true, // Force this to always be true
        preventAutoClose: true,
        preventBackdropClick: true,
        'data-modal-id': id,
        'data-mounted-at': mountTimeRef.current,
        'data-component-name': Component?.name || 'UnknownComponent',
        'data-stabilized': isStabilized,
        className: `${modalProps.className || ''} stable-modal-wrapper`,
      };
    }, [id, modalProps, onClose, Component?.name, isStabilized]);

    // This is the critical part - we use the stable function ref to render the component
    // This prevents React from unmounting/remounting during reconciliation
    const modalContent = (
      <Modal
        {...stableModalProps}
        ref={node => {
          modalNodeRef.current = node;
          if (ref) {
            if (typeof ref === 'function') {
              ref(node);
            } else {
              ref.current = node;
            }
          }
        }}
      >
        {stableComponentRenderFn.current
          ? stableComponentRenderFn.current(stableProps)
          : null}
      </Modal>
    );

    // Get the portal root element instead of creating individual containers
    const portalRoot = document.getElementById('portal-root') || document.body;

    // Use createPortal to render the modal outside the normal component hierarchy
    // This ensures all modals render to the same container with consistent z-index and styling
    return createPortal(modalContent, portalRoot);
  }),
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    // Always return true to prevent re-renders that might cause unmounting
    // We're managing props updates internally with useMemo

    // For universe-create modals, be extra cautious about re-renders
    if (
      prevProps.modalProps['data-modal-type'] === 'universe-create' ||
      nextProps.modalProps['data-modal-type'] === 'universe-create'
    ) {
      console.log('Preventing re-render of universe-create modal');
      return true;
    }

    return true;
  }
);

const GlobalModal = () => {
  const { modals, closeModal } = useModal();
  const modalRenderCountRef = useRef({});
  const [renderCount, setRenderCount] = useState(0);
  // Add a state to track modal rendering errors
  const [renderErrors, setRenderErrors] = useState({});
  // Add a ref to track the number of modals by type
  const modalCountByTypeRef = useRef({});
  // Maximum number of modals of the same type allowed
  const MAX_MODALS_PER_TYPE = 1;

  // Helper function to safely create ISO date strings
  const safeISOString = timestamp => {
    try {
      // Handle undefined timestamp
      if (timestamp === undefined || timestamp === null) {
        // Only log a warning in development mode to reduce console noise
        if (process.env.NODE_ENV === 'development') {
          console.debug('Timestamp is undefined, using current time');
        }
        return new Date().toISOString();
      }

      // Validate the timestamp is within safe range
      if (
        timestamp &&
        typeof timestamp === 'number' &&
        timestamp > 0 &&
        timestamp < 8640000000000000
      ) {
        // Max valid JS date
        return new Date(timestamp).toISOString();
      } else {
        // Only log a warning in development mode to reduce console noise
        if (process.env.NODE_ENV === 'development') {
          console.debug(`Invalid timestamp: ${timestamp}, using current time`);
        }
        return new Date().toISOString(); // Fallback to current time
      }
    } catch (error) {
      console.error(`Error creating ISO string:`, error);
      return new Date().toISOString(); // Fallback to current time
    }
  };

  // Create a ref to store stable instances of modal components
  const stableModalInstancesRef = useRef({});

  // Add more debug info on modals state changes
  useEffect(() => {
    console.log('GlobalModal - modals state changed:', {
      count: modals.length,
      ids: modals.map(m => m.id),
      types: modals.map(m => m.modalType),
    });

    // Force a re-render to ensure modals are displayed
    setRenderCount(prev => prev + 1);
  }, [modals]);

  // Listen for modal:reopen events
  useEffect(() => {
    const handleReopenModal = event => {
      const { modalType, modalId } = event.detail || {};
      console.log(`Received modal:reopen event for ${modalType}`, event.detail);

      // Force a re-render to ensure modals are displayed
      setRenderCount(prev => prev + 1);
    };

    window.addEventListener('modal:reopen', handleReopenModal);
    return () => {
      window.removeEventListener('modal:reopen', handleReopenModal);
    };
  }, []);

  // Listen for modal:mounted events
  useEffect(() => {
    const handleModalMounted = event => {
      const { modalType, modalId } = event.detail || {};
      console.log(
        `Received modal:mounted event for ${modalType}`,
        event.detail
      );

      // Force a re-render to ensure modals are displayed
      setRenderCount(prev => prev + 1);
    };

    window.addEventListener('modal:mounted', handleModalMounted);
    return () => {
      window.removeEventListener('modal:mounted', handleModalMounted);
    };
  }, []);

  // Safe close function to prevent errors
  const safeOnClose = useCallback(
    id => {
      try {
        console.log(`GlobalModal - closing modal ${id}`);
        closeModal(id);
      } catch (error) {
        console.error(`Error closing modal ${id}:`, error);
      }
    },
    [closeModal]
  );

  const renderModals = () => {
    console.log('GlobalModal - sorting modals, count:', modals.length);

    if (!modals.length) {
      console.log('GlobalModal - no modals to render, returning null');
      return null;
    }

    // Sort modals by creation time (oldest first)
    const sortedModals = [...modals].sort((a, b) => {
      try {
        const aTime = parseInt(a.id.split('-')[1]) || 0;
        const bTime = parseInt(b.id.split('-')[1]) || 0;
        return aTime - bTime;
      } catch (error) {
        console.error('Error sorting modals:', error);
        return 0; // Keep original order if there's an error
      }
    });

    console.log('GlobalModal - rendering', sortedModals.length, 'modals');

    // Filter out duplicate modals of the same type, keeping only the oldest one
    const uniqueModalTypes = new Set();
    const filteredModals = sortedModals.filter(modal => {
      if (!modal.modalType) {
        return true; // Keep modals without a type
      }

      if (uniqueModalTypes.has(modal.modalType)) {
        console.warn(
          `Filtering out duplicate modal of type ${modal.modalType} (ID: ${modal.id})`
        );
        return false;
      }

      uniqueModalTypes.add(modal.modalType);
      return true;
    });

    // Limit the total number of modals to render to 5
    const MAX_TOTAL_MODALS = 5;
    if (filteredModals.length > MAX_TOTAL_MODALS) {
      console.warn(
        `Too many modals (${filteredModals.length}), limiting to ${MAX_TOTAL_MODALS}`
      );
      filteredModals.splice(MAX_TOTAL_MODALS);
    }

    console.log(
      'GlobalModal - rendering',
      filteredModals.length,
      'modals after filtering'
    );

    return filteredModals.map(modal => {
      const { id, component: Component, props = {}, modalProps = {} } = modal;

      // Track render count for debugging
      modalRenderCountRef.current[id] =
        (modalRenderCountRef.current[id] || 0) + 1;

      // Add debugging to check if Component is valid
      if (!Component || typeof Component !== 'function') {
        // Check if it's a React.memo component
        const isMemoComponent =
          Component &&
          typeof Component === 'object' &&
          Component.$$typeof === Symbol.for('react.memo') &&
          typeof Component.type === 'function';

        if (!isMemoComponent) {
          console.error(
            `Invalid component for modal ${id} of type ${modal.modalType}:`,
            Component
          );
          return null;
        }
      }

      console.log(
        `Rendering modal: ${id} type: ${modal.modalType} component: ${
          Component?.displayName || Component?.name || 'Unknown'
        } render count: ${modalRenderCountRef.current[id] - 1}`
      );

      if (!Component) {
        console.error(`No component provided for modal ${id}`);
        return null;
      }

      // Special handling for universe-create modals
      if (modal.modalType === 'universe-create') {
        console.log('Rendering universe-create modal with special handling');
      }

      // Create a stable wrapper for this modal
      if (!stableModalInstancesRef.current[id]) {
        // Create a new stable instance for this modal
        stableModalInstancesRef.current[id] = memo(
          () => {
            console.log(`Creating stable instance for modal ${id}`);

            // Enhanced props with debugging info
            const enhancedProps = {
              ...props,
              _renderCount: modalRenderCountRef.current[id],
              _modalId: id,
              _modalType: modal.modalType,
              _createdAt: Date.now(),
            };

            const enhancedModalProps = {
              ...modalProps,
              'data-modal-id': id,
              'data-modal-type': modal.modalType || 'unknown',
              'data-render-count': modalRenderCountRef.current[id],
              'data-creation-time': (() => {
                try {
                  const timestamp = id.split('-')[1];
                  return timestamp && !isNaN(parseInt(timestamp))
                    ? timestamp
                    : Date.now().toString();
                } catch (error) {
                  console.error(
                    `Error parsing creation time from modal ID ${id}:`,
                    error
                  );
                  return Date.now().toString();
                }
              })(),
              className: `${modalProps.className || ''} global-modal`,
            };

            console.log(`Modal ${id} props:`, enhancedProps);
            console.log(`Modal ${id} modalProps:`, enhancedModalProps);

            return (
              <StableModalWrapper
                key={id}
                id={id}
                Component={Component}
                props={enhancedProps}
                modalProps={enhancedModalProps}
                onClose={() => safeOnClose(id)}
                ref={node => {
                  // Store the component instance, not the DOM node
                  if (node) {
                    stableModalInstancesRef.current[id] = () => (
                      <StableModalWrapper
                        key={id}
                        id={id}
                        Component={Component}
                        props={enhancedProps}
                        modalProps={enhancedModalProps}
                        onClose={() => safeOnClose(id)}
                      />
                    );
                  }
                }}
              />
            );
          },
          () => true // Always return true to prevent re-renders
        );

        console.log(
          `New modal added to state: ${id} (${modal.modalType}) - Component: ${
            Component?.displayName || Component?.name || 'Unknown'
          }`
        );
      }

      // Render the stable instance
      const StableInstance = stableModalInstancesRef.current[id];
      return StableInstance ? <StableInstance key={id} /> : null;
    });
  };

  // Always render the container, even if there are no modals
  return (
    <div className="global-modal-container" data-render-count={renderCount}>
      {modals.length > 0 ? (
        renderModals()
      ) : (
        <div style={{ display: 'none' }}>
          {console.log('GlobalModal - no modals to render, returning null')}
        </div>
      )}
    </div>
  );
};

export default GlobalModal;
