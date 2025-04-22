import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useModal } from '../../contexts/ModalContext';
import { selectModalProps } from '../../store/slices/modalSlice';
import { getModalComponent } from '../../utils/modalRegistry';
import { ensurePortalRoot } from '../../utils/portalUtils';

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
    const ModalComponent = getModalComponent(modalProps.type);
    if (ModalComponent) {
      return <ModalComponent {...modalProps} onClose={close} />;
    }
  }

  return null;
};

export default GlobalModal;
