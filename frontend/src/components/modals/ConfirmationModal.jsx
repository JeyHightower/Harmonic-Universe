import React from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import Modal from "../common/Modal";
import { selectIsModalOpen } from "../../store/slices/modalSlice";

const ConfirmationModal = ({
  title,
  message,
  confirmText = "Yes",
  cancelText = "No",
  confirmId,
  cancelId,
  onClose,
  ...props
}) => {
  const isOpen = useSelector(selectIsModalOpen);

  const handleConfirm = () => {
    console.log("Confirmation modal confirmed:", confirmId);
    if (confirmId) {
      const event = new CustomEvent("modal-confirm", {
        detail: { action: confirmId },
      });
      document.dispatchEvent(event);
    }
    onClose();
  };

  const handleCancel = () => {
    console.log("Confirmation modal cancelled:", cancelId);
    if (cancelId) {
      const event = new CustomEvent("modal-cancel", {
        detail: { action: cancelId },
      });
      document.dispatchEvent(event);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      type="confirm"
      title={title}
      onClose={onClose}
      {...props}
    >
      <div className="modal-content">
        <p>{message}</p>
        <div className="modal-actions">
          <button
            onClick={handleCancel}
            className="modal-button modal-button-secondary"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className="modal-button modal-button-primary"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

ConfirmationModal.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  confirmId: PropTypes.string,
  cancelId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

export default ConfirmationModal;
