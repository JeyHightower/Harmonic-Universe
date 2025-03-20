import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import useModal from '../../hooks/useModal';
import { selectModalType, selectModalProps } from '../../store/slices/modalSlice';
import { getModalComponent } from '../modals';
import StableModalWrapper from './StableModalWrapper';

const GlobalModal = () => {
  const modalType = useSelector(selectModalType);
  const modalProps = useSelector(selectModalProps);
  const { closeModal } = useModal();

  useEffect(() => {
    // Create modal root if it doesn't exist
    let modalRoot = document.getElementById('modal-root');
    if (!modalRoot) {
      modalRoot = document.createElement('div');
      modalRoot.id = 'modal-root';
      document.body.appendChild(modalRoot);
    }

    return () => {
      // Clean up modal root on unmount if empty
      modalRoot = document.getElementById('modal-root');
      if (modalRoot && !modalRoot.hasChildNodes()) {
        document.body.removeChild(modalRoot);
      }
    };
  }, []);

  if (!modalType) return null;

  const ModalComponent = getModalComponent(modalType);
  if (!ModalComponent) {
    console.warn(`No modal component found for type: ${modalType}`);
    return null;
  }

  return (
    <StableModalWrapper isOpen={!!modalType} onClose={closeModal}>
      <ModalComponent {...modalProps} onClose={closeModal} />
    </StableModalWrapper>
  );
};

export default GlobalModal;
