import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import useModal from '../hooks/useModal.js';
import { selectModalProps, selectModalType } from '../store/modalSlice.js';
import { getModalComponent } from './ModalUtils.jsx';

const GlobalModal = () => {
  const modalType = useSelector(selectModalType);
  const modalProps = useSelector(selectModalProps);
  const { closeModal } = useModal();
  const portalRootRef = useRef(null);

  // One-time portal root setup
  useEffect(() => {
    // Check for portal-root from index.html first
    let portalRoot = document.getElementById('portal-root');

    // Create modal root if it doesn't exist (fallback)
    if (!portalRoot) {
      console.debug('Creating portal-root element');
      portalRoot = document.createElement('div');
      portalRoot.id = 'portal-root';
      document.body.appendChild(portalRoot);
      portalRootRef.current = portalRoot;
    } else {
      console.debug('Using existing portal-root element');
      portalRootRef.current = portalRoot;
    }

    return () => {
      // Don't remove the portal-root if it was in the original HTML
      // Only clean up dynamically created elements
      if (portalRootRef.current) {
        const wasAddedDynamically = !document.querySelector('html > body > #portal-root');
        if (wasAddedDynamically && !portalRootRef.current.hasChildNodes()) {
          console.debug('Removing dynamically created portal-root');
          document.body.removeChild(portalRootRef.current);
        }
      }
    };
  }, []); // Empty dependency array - only run once on mount

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

  // Render the modal component directly
  return <ModalComponent {...modalProps} onClose={closeModal} />;
};

export default GlobalModal;
