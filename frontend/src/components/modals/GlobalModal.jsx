import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useModal } from '../../contexts/ModalContext';
import { selectModalProps } from '../../store/slices/modalSlice';

const GlobalModal = () => {
  const modalProps = useSelector(selectModalProps);
  const { close } = useModal();

  // Add console log to debug modal state
  useEffect(() => {
    console.debug('Modal state changed:', {
      hasProps: !!modalProps,
    });
  }, [modalProps]);

  if (!modalProps) return null;

  // If a specific modal component is requested, use it
  if (modalProps.type) {
    // Dynamically import getModalComponent
    const [ModalComponent, setModalComponent] = React.useState(null);
    React.useEffect(() => {
      let mounted = true;
      (async () => {
        const { getModalComponent } = await import('../../utils/modalRegistry');
        const Comp = getModalComponent(modalProps.type);
        if (mounted) setModalComponent(() => Comp);
      })();
      return () => {
        mounted = false;
      };
    }, [modalProps.type]);
    if (ModalComponent) {
      return <ModalComponent {...modalProps} onClose={close} />;
    }
  }

  return null;
};

export default GlobalModal;
