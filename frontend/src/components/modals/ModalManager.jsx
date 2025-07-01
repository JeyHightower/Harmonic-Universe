import { Suspense, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import useModalState from '../../hooks/useModalState';
import {
  selectIsModalOpen,
  selectModalProps,
  selectModalType,
} from '../../store/slices/newModalSlice';
import Modal from './Modal';

/**
 * ModalManager component that renders the correct modal based on Redux state
 * This component should be mounted once at the application root
 */
const ModalManager = () => {
  const isOpen = useSelector(selectIsModalOpen);
  const type = useSelector(selectModalType);
  const props = useSelector(selectModalProps);
  const { close } = useModalState();
  const [ModalComponent, setModalComponent] = useState(null);

  // Effect for body scroll locking
  useEffect(() => {
    if (isOpen) {
      // Lock body scroll
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore body scroll
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Load the appropriate modal component when type changes
  useEffect(() => {
    if (!type) {
      setModalComponent(null);
      return;
    }

    const loadAsyncComponent = async () => {
      try {
        const { getModalComponent } = await import(
          /* @vite-ignore */ '../../utils/modalRegistry.js'
        );
        const asyncComponent = await getModalComponent(type);
        if (asyncComponent) {
          setModalComponent(() => asyncComponent);
        } else {
          console.warn(`No modal component found for type: ${type}`);
          setModalComponent(null);
        }
      } catch (error) {
        console.error(`Error loading modal component for type ${type}:`, error);
        setModalComponent(null);
      }
    };

    loadAsyncComponent();
  }, [type]);

  // Render nothing if no modal is open or no component is found
  if (!isOpen || !type || !ModalComponent) {
    return null;
  }

  // Extract modal-specific props from props, rest goes to the component
  const {
    title,
    size = 'medium',
    position = 'center',
    closeOnEscape = true,
    closeOnBackdrop = true,
    showCloseButton = true,
    ...componentProps
  } = props;

  return (
    <Suspense fallback={<div className="modal-loading">Loading...</div>}>
      <Modal
        isOpen={isOpen}
        onClose={close}
        title={title}
        size={size}
        position={position}
        closeOnEscape={closeOnEscape}
        closeOnBackdrop={closeOnBackdrop}
        showCloseButton={showCloseButton}
      >
        <ModalComponent onClose={close} {...componentProps} />
      </Modal>
    </Suspense>
  );
};

export default ModalManager;
