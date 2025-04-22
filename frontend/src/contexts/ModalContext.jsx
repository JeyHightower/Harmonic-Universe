import PropTypes from 'prop-types';
import { Suspense, createContext, useCallback, useContext, useEffect, useState } from 'react';
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
    updateModalProps
} from '../store/slices/modalSlice';
import {
    MODAL_CONFIG,
    getModalAnimationStyles,
    getModalPositionStyles,
    getModalSizeStyles,
    getModalTypeStyles,
} from '../utils/config';
import modalRegistry from '../utils/modalRegistry';
import { cleanupAllPortals, createPortalContainer, ensurePortalRoot, removePortalContainer } from '../utils/portalUtils';

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

// Separate component to handle modal rendering
const ModalRenderer = ({ type, props, onClose }) => {
  const [ModalComponent, setModalComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalContainerId] = useState(`modal-portal-${type}-${Date.now()}`);
  const dispatch = useDispatch();

  console.log('ModalRenderer: Rendering modal of type:', type, 'with props:', props);

  // Enhanced close handler that ensures proper cleanup
  const handleClose = useCallback((e) => {
    // If there's no event, this is an explicit close call (like from a button)
    // In this case, we should proceed with closing
    if (!e || !e.target) {
      console.log('ModalRenderer: Explicit close call for modal of type:', type);
      if (onClose && typeof onClose === 'function') {
        onClose();
      }
      return;
    }

    // If there is an event with a target, we need to determine if this is a backdrop click
    // Get the closest modal container or content element
    const modalContent = e.target.closest('.modal-content, .ant-modal-content');
    const modalContainer = e.target.closest('.modal-container, .ant-modal-wrap');

    // Check if click is directly on the backdrop (on container but not on content)
    const isBackdropClick = modalContainer && !modalContent;

    console.log('ModalRenderer: Click detected', {
      isBackdropClick,
      hasModalContent: !!modalContent,
      hasModalContainer: !!modalContainer,
      targetClass: e.target.className
    });

    // If clicking inside modal content, don't close
    if (modalContent) {
      console.log('ModalRenderer: Click detected inside modal content, preventing close');
      e.stopPropagation();
      return; // Don't close if clicked inside modal content
    }

    // If it's not a backdrop click, also prevent close
    if (!isBackdropClick) {
      console.log('ModalRenderer: Click not on backdrop, preventing close');
      e.stopPropagation();
      return;
    }

    // Only proceed with close if this is a backdrop click
    console.log('ModalRenderer: Backdrop click detected, closing modal of type:', type);

    // Always stop propagation to prevent bubbling
    if (e && e.stopPropagation) {
      e.stopPropagation();
      e.preventDefault();
    }

    // Call the original onClose first
    if (onClose && typeof onClose === 'function') {
      onClose();
    }

    // Ensure body scroll is properly restored
    document.body.classList.remove('modal-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';

    // Clean up the portal container
    setTimeout(() => {
      removePortalContainer(portalContainerId);
    }, 300); // Wait for animation to complete

    // Dispatch an event to reset the UI state
    window.dispatchEvent(new CustomEvent('storage'));

    // Dispatch Redux action to complete modal closing
    dispatch(closeModalComplete());
  }, [type, onClose, dispatch, portalContainerId]);

  useEffect(() => {
    // Ensure the portal root exists
    ensurePortalRoot();

    // Create a specific container for this modal instance
    createPortalContainer(portalContainerId);

    const loadModalComponent = async () => {
      console.log('ModalRenderer: Loading component for modal type:', type);
      try {
        const component = await modalRegistry.getModalComponent(type);
        if (component) {
          console.log('ModalRenderer: Successfully loaded component for type:', type);
          setModalComponent(() => component);
        } else {
          console.error('ModalRenderer: Component loader returned null for type:', type);
        }
      } catch (error) {
        console.error(`ModalRenderer: Error loading modal component for type ${type}:`, error);
      } finally {
        setLoading(false);
      }
    };

    loadModalComponent();

    // Cleanup function
    return () => {
      // Ensure we clean up any lingering body modifications when component unmounts
      document.body.classList.remove('modal-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';

      // Remove the portal container
      removePortalContainer(portalContainerId);
    };
  }, [type, portalContainerId]);

  if (loading) {
    console.log('ModalRenderer: Still loading component for type:', type);
    return <div>Loading modal...</div>;
  }

  if (!ModalComponent) {
    console.error(`ModalRenderer: Modal component not found for type: ${type}`);
    return null;
  }

  console.log(
    'ModalRenderer: Rendering component for type:',
    type,
    'Component:',
    ModalComponent.name || 'Unknown'
  );

  // Check if this is a SceneModal and ensure modalType is passed
  const modalProps = {
    ...props,
    // If this is a SceneModal (SCENE_FORM type), pass modalType
    ...(type === 'SCENE_FORM' && {
      modalType: props.modalType || 'create',
      // For consolidated component - map to its expected prop names
      mode: props.modalType || 'create',
      open: true,
    }),
  };

  // Use different wrapper approach based on component type
  // Most components should be wrapped in StableModalWrapper
  // Some components might already have their own Modal implementation
  const hasBuiltInModal = ModalComponent.hasOwnProperty('__hasBuiltInModal') &&
                          ModalComponent.__hasBuiltInModal === true;

  // The onClick handler to prevent events from reaching parent elements
  const handleModalContainerClick = (e) => {
    // Get the clicked element
    const target = e.target;

    // Check if the click is directly on the container (backdrop)
    // We consider a click on the container only if:
    // 1. The click target is exactly the container element
    // 2. The click is not within any .modal-content or .ant-modal-content elements
    const isDirectContainerClick = target === e.currentTarget;
    const isWithinContent = !!target.closest('.modal-content, .ant-modal-content');

    console.log('Container click:', {
      isDirectContainerClick,
      isWithinContent,
      targetClass: target.className,
      currentTargetClass: e.currentTarget.className
    });

    // If it's a backdrop click (direct container click and not within content)
    if (isDirectContainerClick && !isWithinContent) {
      console.log('Backdrop click detected, calling handleClose');
      // When clicked on backdrop, call handleClose to decide what to do
      handleClose(e);
    } else {
      // Otherwise, just prevent propagation
      console.log('Content click detected, just stopping propagation');
      e.stopPropagation();
    }
  };

  // Specific content click handler to ensure the modal doesn't close
  const handleContentClick = (e) => {
    // Log the click for debugging
    console.log('Content click:', { targetClass: e.target.className });

    // Always stop propagation for content clicks
    e.stopPropagation();

    // Prevent this click from triggering any backdrop close handlers
    e.nativeEvent.stopImmediatePropagation();
  };

  if (hasBuiltInModal) {
    // For components with built-in modals, render them directly with open=true
    return (
      <div
        className="modal-container"
        onClick={handleModalContainerClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1050,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'auto'
        }}
      >
        <div
          className="modal-content"
          onClick={handleContentClick}
          style={{
            pointerEvents: 'auto',
            zIndex: 1051,
            position: 'relative'
          }}
        >
          <ModalComponent
            open={true}
            isOpen={true}
            onClose={handleClose}
            onClick={handleContentClick}
            style={{ pointerEvents: 'auto' }}
            {...modalProps}
          />
        </div>
      </div>
    );
  } else {
    // Wrap in StableModalWrapper for consistent behavior
    const title = modalProps.title || ModalComponent.defaultProps?.title || type;

    return (
      <div
        className="modal-container"
        onClick={handleModalContainerClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1050,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'auto'
        }}
      >
        <StableModalWrapper
          title={title}
          open={true}
          onClose={handleClose}
          width={modalProps.width || 600}
          style={{ pointerEvents: 'auto' }}
        >
          <div
            onClick={handleContentClick}
            className="modal-content"
            style={{
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 1051
            }}
          >
            <ModalComponent
              {...modalProps}
              onClose={handleClose}
              style={{
                ...getModalSizeStyles(props.size || MODAL_CONFIG.SIZES.MEDIUM),
                ...getModalTypeStyles(type),
                ...getModalAnimationStyles(props.animation || MODAL_CONFIG.ANIMATIONS.FADE),
                ...getModalPositionStyles(props.position || MODAL_CONFIG.POSITIONS.CENTER),
                ...props.style,
                pointerEvents: 'auto'
              }}
            />
          </div>
        </StableModalWrapper>
      </div>
    );
  }
};

ModalRenderer.propTypes = {
  type: PropTypes.string.isRequired,
  props: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

// Provider component
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
  }, []);

  return (
    <ModalContext.Provider value={value}>
      {children}
      {isOpen && (
        <Suspense fallback={<div>Loading...</div>}>
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
