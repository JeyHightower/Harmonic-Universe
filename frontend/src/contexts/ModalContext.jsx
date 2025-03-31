import PropTypes from "prop-types";
import React, {
  createContext,
  useContext,
  useEffect,
  Suspense,
  useRef,
} from "react";
import { useSelector } from "react-redux";
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
  const ModalComponent = getModalComponent(type);
  if (!ModalComponent) {
    console.error(`Modal component not found for type: ${type}`);
    return null;
  }

  return (
    <ModalComponent
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
const ModalProvider = ({ children }) => {
  const portalRootRef = useRef(null);
  const modalState = useSelector(selectModalState);
  const isOpen = useSelector(selectIsModalOpen);
  const type = useSelector(selectModalType);
  const props = useSelector(selectModalProps);
  const isTransitioning = useSelector(selectIsModalTransitioning);

  // Ensure portal root exists and store reference
  useEffect(() => {
    try {
      portalRootRef.current = ensurePortalRoot();
      console.log("[ModalContext] Portal root created/verified");
    } catch (error) {
      console.error("[ModalContext] Error creating portal root:", error);
    }
  }, []);

  const value = {
    isModalOpen: isOpen,
    modalType: type,
    modalProps: props,
    isTransitioning,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      {isOpen && portalRootRef.current && (
        <Suspense fallback={<div>Loading modal...</div>}>
          <ModalRenderer
            type={type}
            props={props}
            onClose={() => {
              // Close modal through Redux
              const event = new CustomEvent("modal-close");
              document.dispatchEvent(event);
            }}
          />
        </Suspense>
      )}
    </ModalContext.Provider>
  );
};

ModalProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { ModalProvider };
