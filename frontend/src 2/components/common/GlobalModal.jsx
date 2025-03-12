import React, { useMemo } from 'react';
import { useModal } from '../../contexts/ModalContext';
import Modal from './Modal';

const GlobalModal = () => {
  const { modals, closeModal } = useModal();

  // Sort modals by their position in the array to maintain proper stacking order
  const sortedModals = useMemo(() => {
    return [...modals].sort((a, b) => {
      const indexA = modals.indexOf(a);
      const indexB = modals.indexOf(b);
      return indexA - indexB;
    });
  }, [modals]);

  if (sortedModals.length === 0) return null;

  return (
    <>
      {sortedModals.map(modal => {
        const { id, component: Component, props, modalProps } = modal;
        return (
          <Modal key={id} {...modalProps} onClose={() => closeModal(id)}>
            <Component {...props} onClose={() => closeModal(id)} />
          </Modal>
        );
      })}
    </>
  );
};

export default GlobalModal;
