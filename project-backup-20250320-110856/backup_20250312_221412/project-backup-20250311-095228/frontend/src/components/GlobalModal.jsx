import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import useModal from '../hooks/useModal.js';
import { selectModalType, selectModalProps } from '../store/modalSlice.js';
import { getModalComponent } from './Modal.jsx';
import StableModalWrapper from './StableModalWrapper';

const GlobalModal = () => {
  const modalType = useSelector(selectModalType);
  const modalProps = useSelector(selectModalProps);
  const { closeModal } = useModal();

  useEffect(() => {
    // Check for portal-root from index.html first
    let portalRoot = document.getElementById('portal-root');

    // Create modal root if it doesn't exist (fallback)
    if (!portalRoot) {
      console.debug('Creating portal-root element');
      portalRoot = document.createElement('div');
      portalRoot.id = 'portal-root';
      document.body.appendChild(portalRoot);
    } else {
      console.debug('Using existing portal-root element');
    }

    return () => {
      // Don't remove the portal-root if it was in the original HTML
      // Only clean up dynamically created elements
      portalRoot = document.getElementById('portal-root');
      const wasAddedDynamically = !document.querySelector('html > body > #portal-root');
      if (portalRoot && wasAddedDynamically && !portalRoot.hasChildNodes()) {
        console.debug('Removing dynamically created portal-root');
        document.body.removeChild(portalRoot);
      }
    };
  }, []);

  // Add console log to debug modal state
  useEffect(() => {
    console.debug('Modal state changed:', { modalType, hasProps: !!modalProps });
  }, [modalType, modalProps]);

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
