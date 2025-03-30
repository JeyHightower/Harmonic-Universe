import PropTypes from 'prop-types';
import React, { createContext, useContext, useState } from 'react';

// Create the context
const ModalContext = createContext(null);

// Custom hook to use the modal context
export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

// Provider component
export function ModalProvider({ children }) {
  const [modalType, setModalType] = useState(null);
  const [modalProps, setModalProps] = useState({});

  const openModal = (type, props = {}) => {
    console.log(`Opening modal: ${type}`);
    setModalType(type);
    setModalProps(props);
  };

  const closeModal = () => {
    console.log('Closing modal');
    setModalType(null);
    setModalProps({});
  };

  return (
    <ModalContext.Provider value={{ modalType, modalProps, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export default ModalContext;

ModalProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
