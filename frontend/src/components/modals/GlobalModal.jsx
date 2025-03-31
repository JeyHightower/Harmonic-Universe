import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import useModal from "../../hooks/useModal.js";
import { selectModalProps } from "../../store/modalSlice.js";
import { getModalComponent } from "../ModalUtils.jsx";
import { ModalSystem } from "./";
import { ensurePortalRoot } from "../../utils/portalUtils";

const GlobalModal = () => {
  const modalProps = useSelector(selectModalProps);
  const { closeModal } = useModal();

  // Add console log to debug modal state
  useEffect(() => {
    console.debug("Modal state changed:", {
      hasProps: !!modalProps,
    });
  }, [modalProps]);

  if (!modalProps) return null;

  // If a specific modal component is requested, use it
  if (modalProps.type) {
    const ModalComponent = getModalComponent(modalProps.type);
    if (ModalComponent) {
      return <ModalComponent {...modalProps} onClose={closeModal} />;
    }
  }

  // Otherwise, use the ModalSystem
  return <ModalSystem {...modalProps} onClose={closeModal} />;
};

export default GlobalModal;
