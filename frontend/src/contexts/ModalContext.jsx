import PropTypes from "prop-types";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  Suspense,
} from "react";
import { ModalComponents } from "../components";
import ModalSystem from "../components/modals/ModalSystem";
import { MODAL_TYPES } from "../constants/modalTypes";

// Create the context
const ModalContext = createContext();

// Map our modal types to ModalSystem types
const MODAL_TYPE_MAP = {
  LOGIN: "form",
  REGISTER: "form",
  ALERT: "alert",
  CONFIRM: "confirm",
  DEFAULT: "default",
};

// Custom hook to use the modal context
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

// Separate component to handle modal rendering
const ModalRenderer = ({ modalProps, onClose }) => {
  if (!modalProps) return null;

  // Get the appropriate modal component
  let ModalComponent = null;
  switch (modalProps.type) {
    case MODAL_TYPES.LOGIN:
      ModalComponent = ModalComponents.LoginModal;
      break;
    case MODAL_TYPES.REGISTER:
      ModalComponent = ModalComponents.RegisterModal;
      break;
    default:
      ModalComponent = ModalSystem;
  }

  // Map the modal type to the expected type
  const mappedProps = {
    ...modalProps,
    type: MODAL_TYPE_MAP[modalProps.type] || "default",
    isOpen: true,
    onClose,
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ModalComponent {...mappedProps} />
    </Suspense>
  );
};

// Provider component
export const ModalProvider = ({ children }) => {
  const [modalProps, setModalProps] = useState(null);

  const openModal = (props) => {
    setModalProps({ ...props, isOpen: true });
  };

  const closeModal = () => {
    setModalProps(null);
  };

  const value = {
    modalProps,
    openModal,
    closeModal,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      <ModalRenderer modalProps={modalProps} onClose={closeModal} />
    </ModalContext.Provider>
  );
};

export default ModalContext;

ModalProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
