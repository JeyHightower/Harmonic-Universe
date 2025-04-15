import React from "react";
import PropTypes from "prop-types";
import { ModalSystem } from "../modals/index.mjs";
import { MODAL_CONFIG } from "../../utils/config";

/**
 * Modal component that provides backward compatibility with the original Modal API
 * This is a wrapper around ModalSystem for backward compatibility
 */
const Modal = ({
  isOpen,
  onClose,
  children,
  type = MODAL_CONFIG.TYPES.DEFAULT,
  size = MODAL_CONFIG.SIZES.MEDIUM,
  position = MODAL_CONFIG.POSITIONS.CENTER,
  animation = MODAL_CONFIG.ANIMATIONS.FADE,
  draggable = MODAL_CONFIG.DEFAULT_SETTINGS.draggable,
  closeOnEscape = MODAL_CONFIG.DEFAULT_SETTINGS.closeOnEscape,
  closeOnBackdrop = MODAL_CONFIG.DEFAULT_SETTINGS.closeOnBackdrop,
  preventBodyScroll = MODAL_CONFIG.DEFAULT_SETTINGS.preventBodyScroll,
  showCloseButton = MODAL_CONFIG.DEFAULT_SETTINGS.showCloseButton,
  title,
  style = {},
}) => {
  // Map the old props to the new ModalSystem props
  return (
    <ModalSystem
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      type={type}
      size={size}
      position={position}
      animation={animation}
      draggable={draggable}
      closeOnEscape={closeOnEscape}
      closeOnBackdrop={closeOnBackdrop}
      preventBodyScroll={preventBodyScroll}
      showCloseButton={showCloseButton}
      style={style}
    >
      {children}
    </ModalSystem>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(Object.values(MODAL_CONFIG.TYPES)),
  size: PropTypes.oneOf(Object.values(MODAL_CONFIG.SIZES)),
  position: PropTypes.oneOf(Object.values(MODAL_CONFIG.POSITIONS)),
  animation: PropTypes.oneOf(Object.values(MODAL_CONFIG.ANIMATIONS)),
  draggable: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
  closeOnBackdrop: PropTypes.bool,
  preventBodyScroll: PropTypes.bool,
  showCloseButton: PropTypes.bool,
  title: PropTypes.string,
  style: PropTypes.object,
};

export default Modal;
