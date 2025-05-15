import PropTypes from 'prop-types';
import { createContext, useContext } from 'react';
import { useModalRedux } from '../hooks/useModal';

// Create the context
const ModalContext = createContext();

// Custom hook to use the modal context - provides backward compatibility
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

// Provider component as a lightweight wrapper around Redux
export const ModalProvider = ({ children }) => {
  // Use the Redux-based hook internally
  const modalAPI = useModalRedux();

  return <ModalContext.Provider value={modalAPI}>{children}</ModalContext.Provider>;
};

ModalProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
