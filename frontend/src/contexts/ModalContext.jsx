import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export const modalTypes = {
  // Universe modals
  CREATE_UNIVERSE: 'CREATE_UNIVERSE',
  EDIT_UNIVERSE: 'EDIT_UNIVERSE',
  DELETE_UNIVERSE: 'DELETE_UNIVERSE',

  // Visualization modals
  CREATE_VISUALIZATION: 'CREATE_VISUALIZATION',
  EDIT_VISUALIZATION: 'EDIT_VISUALIZATION',
  DELETE_VISUALIZATION: 'DELETE_VISUALIZATION',

  // Audio modals
  CREATE_AUDIO: 'CREATE_AUDIO',
  EDIT_AUDIO: 'EDIT_AUDIO',
  DELETE_AUDIO: 'DELETE_AUDIO',
};

const ModalContext = createContext({
  modalState: {
    open: false,
    type: null,
    data: null,
  },
  openModal: () => {},
  closeModal: () => {},
});

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    open: false,
    type: null,
    data: null,
  });

  const openModal = useCallback((type, data = null) => {
    setModalState({
      open: true,
      type,
      data,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      open: false,
    }));

    // Reset state after animation completes
    setTimeout(() => {
      setModalState({
        open: false,
        type: null,
        data: null,
      });
    }, 300);
  }, []);

  const value = useMemo(
    () => ({
      modalState,
      openModal,
      closeModal,
    }),
    [modalState, openModal, closeModal]
  );

  return (
    <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
