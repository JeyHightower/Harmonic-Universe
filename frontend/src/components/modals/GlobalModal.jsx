import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { useModal } from "../../contexts/ModalContext";
import { selectModalProps } from "../../store/slices/modalSlice";
import { getModalComponent, ensurePortalRoot } from "../../utils";
import { closeModal } from "../../store/slices/modalSlice";
import { registerModal } from "../../utils";
import modalRegistry from "../../utils/modalRegistry";

const GlobalModal = () => {
  const { showModal, hideModal } = useModal();
  const modalProps = useSelector(selectModalProps);

  // Add console log to debug modal state
  useEffect(() => {
    console.debug("Modal state changed:", {
      hasProps: !!modalProps,
    });
  }, [modalProps]);

  if (!modalProps) return null;

  // If a specific modal component is requested, use it
  if (modalProps.type) {
    const ModalComponent = modalRegistry.getModalComponent(modalProps.type);
    if (ModalComponent) {
      return <ModalComponent {...modalProps} onClose={hideModal} />;
    }
  }

  return null;
};

export default GlobalModal;
