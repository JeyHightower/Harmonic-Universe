import React, { useState } from "react";
import { useModal, useModalType } from "../../hooks/useModal";
import { MODAL_TYPES } from "../../constants/modalTypes";
import { MODAL_CONFIG } from "../../utils/config";
import "../../styles/ModalExample.css";

const ModalExample = () => {
  const { open, close, isOpen, type, props, isTransitioning } = useModal();
  const alertModal = useModalType(MODAL_TYPES.ALERT);
  const confirmModal = useModalType(MODAL_TYPES.CONFIRMATION);
  const formModal = useModalType(MODAL_TYPES.FORM);
  const networkErrorModal = useModalType(MODAL_TYPES.NETWORK_ERROR);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleOpenAlert = () => {
    alertModal.open({
      title: "Alert Modal",
      message: "This is an alert modal example.",
      confirmText: "OK",
      onConfirm: alertModal.close,
    });
  };

  const handleOpenConfirm = () => {
    confirmModal.open({
      title: "Confirmation Modal",
      message: "Are you sure you want to proceed?",
      confirmText: "Yes",
      cancelText: "No",
      onConfirm: () => {
        console.log("Confirmed");
        confirmModal.close();
      },
      onCancel: confirmModal.close,
    });
  };

  const handleOpenForm = () => {
    formModal.open({
      title: "Form Modal",
      size: MODAL_CONFIG.SIZES.LARGE,
      animation: MODAL_CONFIG.ANIMATIONS.SLIDE,
      draggable: true,
      closeOnBackdrop: false,
      preventBodyScroll: true,
      showCloseButton: true,
      onSubmit: (data) => {
        console.log("Form submitted:", data);
        formModal.close();
      },
      onCancel: formModal.close,
      children: (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            formModal.props.onSubmit(formData);
          }}
          className="modal-form"
        >
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={formModal.close}>
              Cancel
            </button>
            <button type="submit">Submit</button>
          </div>
        </form>
      ),
    });
  };

  const handleOpenNetworkError = () => {
    networkErrorModal.open({
      title: "Network Error",
      message:
        "Failed to connect to the server. Please check your internet connection and try again.",
      onRetry: () => {
        console.log("Retrying connection...");
        networkErrorModal.close();
      },
      onClose: networkErrorModal.close,
    });
  };

  return (
    <div className="modal-example">
      <h2>Modal Examples</h2>
      <div className="modal-buttons">
        <button onClick={handleOpenAlert}>Open Alert Modal</button>
        <button onClick={handleOpenConfirm}>Open Confirmation Modal</button>
        <button onClick={handleOpenForm}>Open Form Modal</button>
        <button onClick={handleOpenNetworkError}>
          Open Network Error Modal
        </button>
      </div>
      {isOpen && (
        <div className="modal-state">
          <h3>Current Modal State</h3>
          <p>Type: {type}</p>
          <p>Props: {JSON.stringify(props, null, 2)}</p>
          <p>Transitioning: {isTransitioning ? "Yes" : "No"}</p>
        </div>
      )}
    </div>
  );
};

export default ModalExample;
