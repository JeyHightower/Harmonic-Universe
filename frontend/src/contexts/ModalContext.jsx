import PropTypes from "prop-types";
import React, { createContext, useContext, useState } from "react";

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
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    props: {},
  });

  const openModal = (type, props = {}) => {
    setModalState({ isOpen: true, type, props });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, props: {} });
  };

  return (
    <ModalContext.Provider value={{ modalState, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
};

export default ModalContext;

ModalProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
