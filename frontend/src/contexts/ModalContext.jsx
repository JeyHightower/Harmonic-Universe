import PropTypes from 'prop-types';
import {
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import StableModalWrapper from '../components/modals/StableModalWrapper';
import {
  closeModal,
  closeModalComplete,
  openModal,
  selectIsModalOpen,
  selectIsModalTransitioning,
  selectModalProps,
  selectModalType,
  updateModalProps,
} from '../store/slices/modalSlice';
import {
  MODAL_CONFIG,
  getModalAnimationStyles,
  getModalPositionStyles,
  getModalSizeStyles,
  getModalTypeStyles,
} from '../utils/config';
import modalRegistry from '../utils/modalRegistry';
import {
  cleanupAllPortals,
  createPortalContainer,
  ensurePortalRoot,
  removePortalContainer,
} from '../utils/portalUtils';

// Create a registry to track registered modals
const registeredModals = {};

// Create the context
const ModalContext = createContext();

// Custom hook to use the modal context
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

// Separate component to handle modal rendering with improved error handling
const ModalRenderer = ({ type, props, onClose }) => {
  const [ModalComponent, setModalComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const portalContainerId = useRef(`modal-portal-${type}-${Date.now()}`);
  const dispatch = useDispatch();
  const unmountingRef = useRef(false);
  const timeoutRef = useRef(null);

  // Enhanced close handler with improved cleanup
  const handleClose = useCallback(
    (e) => {
      // If there's no event, this is an explicit close call (like from a button)
      if (!e || !e.target) {
        if (onClose && typeof onClose === 'function') {
          onClose();
        }
        return;
      }

      // If there is an event with a target, determine if this is a backdrop click
      const modalContent = e.target.closest('.modal-content, .ant-modal-content');
      const modalContainer = e.target.closest('.modal-container, .ant-modal-wrap');
      const isBackdropClick = modalContainer && !modalContent;

      // If clicking inside modal content, don't close
      if (modalContent) {
        e.stopPropagation();
        return;
      }

      // Always stop propagation to prevent bubbling
      if (e && e.stopPropagation) {
        e.stopPropagation();
      }

      // Call the original onClose
      if (onClose && typeof onClose === 'function') {
        onClose();
      }

      // Clean up the portal container with a delay to allow animations
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (!unmountingRef.current) {
          removePortalContainer(portalContainerId.current);
          dispatch(closeModalComplete());
        }
      }, MODAL_CONFIG.ANIMATIONS.FADE.duration);
    },
    [onClose, dispatch]
  );

  // Load the modal component
  useEffect(() => {
    let isMounted = true;
    // Ensure the portal root exists
    ensurePortalRoot();

    // Create a specific container for this modal instance
    createPortalContainer(portalContainerId.current);

    const loadModalComponent = async () => {
      try {
        setLoading(true);
        setError(null);

        const component = await modalRegistry.getModalComponent(type);

        if (!isMounted) return;

        if (component) {
          setModalComponent(() => component);
        } else {
          setError(new Error(`Component loader returned null for type: ${type}`));
        }
      } catch (error) {
        if (isMounted) {
          setError(error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadModalComponent();

    // Cleanup function
    return () => {
      isMounted = false;
      unmountingRef.current = true;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Remove the portal container
      removePortalContainer(portalContainerId.current);
    };
  }, [type]);

  // Error state
  if (error) {
    return (
      <StableModalWrapper title="Error Loading Modal" open={true} onClose={handleClose} width={400}>
        <div className="modal-error">
          <p>Failed to load modal component: {error.message}</p>
          <button onClick={handleClose}>Close</button>
        </div>
      </StableModalWrapper>
    );
  }

  // Loading state
  if (loading) {
    return (
      <StableModalWrapper title="Loading..." open={true} onClose={handleClose} width={400}>
        <div className="modal-loading">
          <p>Loading modal content...</p>
        </div>
      </StableModalWrapper>
    );
  }

  // No component found
  if (!ModalComponent) {
    return (
      <StableModalWrapper title="Error" open={true} onClose={handleClose} width={400}>
        <div className="modal-error">
          <p>Modal component not found for type: {type}</p>
          <button onClick={handleClose}>Close</button>
        </div>
      </StableModalWrapper>
    );
  }

  // Prevent clicks inside modal content from propagating to the backdrop
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  // Add enhanced form field handling
  const handleFormFieldInteraction = (e) => {
    // Always stop propagation to prevent closing the modal
    e.stopPropagation();

    // For input elements, make sure they're properly focusable
    if (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA' ||
      e.target.tagName === 'SELECT'
    ) {
      // Ensure the input gets focus
      if (document.activeElement !== e.target) {
        e.target.focus();
      }
    }
  };

  // Special handling for specific modal types
  const modalProps = {
    ...props,
    onClose: handleClose,
    style: {
      ...getModalSizeStyles(props.size || MODAL_CONFIG.SIZES.MEDIUM),
      ...getModalTypeStyles(type),
      ...getModalAnimationStyles(props.animation || MODAL_CONFIG.ANIMATIONS.FADE),
      ...getModalPositionStyles(props.position || MODAL_CONFIG.POSITIONS.CENTER),
      ...props.style,
      position: 'relative',
      zIndex: 1055,
    },
    className: `modal-interactive ${props.className || ''}`,
  };

  return (
    <div className="modal-container">
      <div className="modal-overlay" onClick={handleClose}>
        <StableModalWrapper
          title={props.title}
          open={true}
          onClose={handleClose}
          width={modalProps.width || 600}
        >
          <div onClick={handleContentClick} className="modal-content">
            <ModalComponent {...modalProps} />
          </div>
        </StableModalWrapper>
      </div>
    </div>
  );
};

ModalRenderer.propTypes = {
  type: PropTypes.string.isRequired,
  props: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

// Provider component with improved error handling and cleanup
export const ModalProvider = ({ children }) => {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsModalOpen);
  const modalType = useSelector(selectModalType);
  const modalProps = useSelector(selectModalProps);
  const isTransitioning = useSelector(selectIsModalTransitioning);

  // Create a function to reset all modal state
  const resetAllModals = useCallback(() => {
    dispatch(closeModal());
    cleanupAllPortals();
  }, [dispatch]);

  const value = {
    open: (type, props = {}) => dispatch(openModal({ type, props })),
    close: () => dispatch(closeModal()),
    updateProps: (props) => dispatch(updateModalProps(props)),
    resetAll: resetAllModals,
    isOpen,
    type: modalType,
    props: modalProps,
    isTransitioning,
  };

  // Ensure portal root exists when provider is mounted
  useEffect(() => {
    ensurePortalRoot();

    // Clean up portals when component unmounts
    return () => {
      cleanupAllPortals();
    };
  }, []);

  // Auto-register modal types if needed
  useEffect(() => {
    if (!modalType) return;

    // Skip if already registered
    if (Object.prototype.hasOwnProperty.call(registeredModals, modalType)) {
      return;
    }

    // Load and register the component
    modalRegistry
      .getModalComponent(modalType)
      .then((component) => {
        if (component) {
          registeredModals[modalType] = component;
        }
      })
      .catch((error) => {
        console.error(`Error registering modal type '${modalType}':`, error);
      });
  }, [modalType]);

  // Add a global modal focus fix event handler
  // This will be called after the component is mounted
  useEffect(() => {
    const fixFormInteractions = () => {
      // Use direct DOM manipulation as a last resort for fixing focus issues
      const modalInputs = document.querySelectorAll(
        '.modal-content input, .modal-content textarea, .modal-content select, ' +
          '.ant-modal-content input, .ant-modal-content textarea, .ant-modal-content select, ' +
          '.MuiDialog-paper input, .MuiDialog-paper textarea, .MuiDialog-paper select'
      );

      modalInputs.forEach((input) => {
        // Set explicit interactive styles
        input.style.pointerEvents = 'auto';
        input.style.cursor =
          input.type === 'button' || input.type === 'submit' ? 'pointer' : 'text';
        input.style.zIndex = '10';

        // Create a new mousedown handler that ensures focus works
        const mousedownHandler = (e) => {
          e.stopPropagation();

          // For buttons, don't interfere with click behavior
          if (input.type !== 'button' && input.type !== 'submit') {
            input.focus();
          }
        };

        // Remove old handler to avoid duplicates
        input.removeEventListener('mousedown', input._mousedownHandler);
        // Store reference to new handler for cleanup
        input._mousedownHandler = mousedownHandler;
        // Add the handler
        input.addEventListener('mousedown', mousedownHandler, true);
      });
    };

    // Apply fixes once on mount and whenever modals should be visible
    if (isOpen) {
      // Use timeout to ensure DOM is ready
      setTimeout(fixFormInteractions, 100);
    }

    // Clean up handlers on unmount
    return () => {
      const modalInputs = document.querySelectorAll(
        '.modal-content input, .modal-content textarea, .modal-content select, ' +
          '.ant-modal-content input, .ant-modal-content textarea, .ant-modal-content select, ' +
          '.MuiDialog-paper input, .MuiDialog-paper textarea, .MuiDialog-paper select'
      );

      modalInputs.forEach((input) => {
        if (input._mousedownHandler) {
          input.removeEventListener('mousedown', input._mousedownHandler);
        }
      });
    };
  }, [isOpen]);

  return (
    <ModalContext.Provider value={value}>
      {children}
      {isOpen && (
        <Suspense
          fallback={
            <StableModalWrapper title="Loading..." open={true}>
              <div>Loading modal content...</div>
            </StableModalWrapper>
          }
        >
          <ModalRenderer
            type={modalType}
            props={modalProps}
            onClose={() => dispatch(closeModal())}
          />
        </Suspense>
      )}
    </ModalContext.Provider>
  );
};

ModalProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
