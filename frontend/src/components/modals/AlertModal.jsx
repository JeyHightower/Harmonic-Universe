import React from "react";
import PropTypes from "prop-types";
import Modal from "../common/Modal";
import { MODAL_CONFIG } from "../../utils/config";

const AlertModal = ({
  title,
  message,
  confirmText = "OK",
  onConfirm,
  onClose,
  ...props
}) => {
  return (
    <Modal
      type="alert"
      title={title}
      onClose={onClose}
      size={MODAL_CONFIG.SIZES.SMALL}
      animation={MODAL_CONFIG.ANIMATIONS.FADE}
      {...props}
    >
      <div className="modal-content">
        <p>{message}</p>
        <div className="modal-actions">
          <button onClick={onConfirm || onClose}>{confirmText}</button>
        </div>
      </div>
    </Modal>
  );
};

AlertModal.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  onConfirm: PropTypes.func,
  onClose: PropTypes.func.isRequired,
};

export default AlertModal;
