import PropTypes from "prop-types";
import React, {
  createContext,
  useContext,
  useEffect,
  Suspense,
  useRef,
  useState,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import { MODAL_TYPES } from "../constants/modalTypes";
import { ensurePortalRoot } from "../utils/portalUtils";
import {
  MODAL_CONFIG,
  getModalSizeStyles,
  getModalTypeStyles,
  getModalAnimationStyles,
  getModalPositionStyles,
} from "../utils/config";
import { getModalComponent } from "../utils/modalRegistry";
import {
  selectModalState,
  selectIsModalOpen,
  selectModalType,
  selectModalProps,
  selectIsModalTransitioning,
  openModal,
  closeModal,
  updateModalProps,
} from "../store/slices/modalSlice";

// Create the context
const ModalContext = createContext();

// Custom hook to use the modal context
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

// Separate component to handle modal rendering
const ModalRenderer = ({ type, props, onClose }) => {
  const [ModalComponent, setModalComponent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadModalComponent = async () => {
      try {
        const component = await getModalComponent(type);
        setModalComponent(() => component);
      } catch (error) {
        console.error(`Error loading modal component for type ${type}:`, error);
      } finally {
        setLoading(false);
      }
    };

    loadModalComponent();
  }, [type]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!ModalComponent) {
    console.error(`Modal component not found for type: ${type}`);
    return null;
  }

  return (
    <ModalComponent
      open={true}
      isOpen={true}
      onClose={onClose}
      {...props}
      style={{
        ...getModalSizeStyles(props.size || MODAL_CONFIG.SIZES.MEDIUM),
        ...getModalTypeStyles(type),
        ...getModalAnimationStyles(
          props.animation || MODAL_CONFIG.ANIMATIONS.FADE
        ),
        ...getModalPositionStyles(
          props.position || MODAL_CONFIG.POSITIONS.CENTER
        ),
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
  const modalState = useSelector(selectModalState);
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
