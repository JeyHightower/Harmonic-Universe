import PropTypes from 'prop-types';
import { Suspense, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  closeModal,
  closeModalComplete,
  openModal,
  selectIsModalOpen,
  selectIsModalTransitioning,
  selectModalProps,
  selectModalState,
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
import { ensurePortalRoot } from '../utils/portalUtils';

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
  const dispatch = useDispatch();

  console.log('ModalRenderer: Rendering modal of type:', type, 'with props:', props);

  // Enhanced close handler that ensures proper cleanup
  const handleClose = useCallback(() => {
    console.log('ModalRenderer: Closing modal of type:', type);

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

    // Dispatch an event to reset the UI state
    window.dispatchEvent(new CustomEvent('storage'));

    // Dispatch Redux action to complete modal closing
    dispatch(closeModalComplete());
  }, [type, onClose, dispatch]);

  useEffect(() => {
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
    };
  }, [type]);

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

  return (
    <ModalComponent
      open={true}
      isOpen={true}
      onClose={handleClose}
      {...modalProps}
      style={{
        ...getModalSizeStyles(props.size || MODAL_CONFIG.SIZES.MEDIUM),
        ...getModalTypeStyles(type),
        ...getModalAnimationStyles(props.animation || MODAL_CONFIG.ANIMATIONS.FADE),
        ...getModalPositionStyles(props.position || MODAL_CONFIG.POSITIONS.CENTER),
        ...props.style,
      }}
    />
  );
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

  const value = {
    open: (type, props = {}) => dispatch(openModal({ type, props })),
    close: () => dispatch(closeModal()),
    updateProps: (props) => dispatch(updateModalProps(props)),
    isOpen,
    type: modalType,
    props: modalProps,
    isTransitioning,
  };

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
