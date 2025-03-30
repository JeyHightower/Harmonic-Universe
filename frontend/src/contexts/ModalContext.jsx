import PropTypes from "prop-types";
import React, { createContext, useContext, useState } from "react";
import ModalSystem from "../components/modals";

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

// Provider component
export const ModalProvider = ({ children }) => {
  const [modalProps, setModalProps] = useState(null);

  const openModal = (props) => {
    setModalProps(props);
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
      {modalProps && <ModalSystem {...modalProps} onClose={closeModal} />}
    </ModalContext.Provider>
  );
};

export default ModalContext;

ModalProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
