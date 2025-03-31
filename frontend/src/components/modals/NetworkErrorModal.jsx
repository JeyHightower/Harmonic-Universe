import React from "react";
import PropTypes from "prop-types";
import Modal from "../common/Modal";

const NetworkErrorModal = ({
  title = "Network Error",
  message = "A network error occurred. Please check your connection and try again.",
  onRetry,
  onClose,
  ...props
}) => {
  return (
    <Modal type="error" title={title} onClose={onClose} {...props}>
      <div className="modal-content">
        <p>{message}</p>
        <div className="modal-actions">
          {onRetry && <button onClick={onRetry}>Retry</button>}
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
};

NetworkErrorModal.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  onRetry: PropTypes.func,
  onClose: PropTypes.func.isRequired,
};

export default NetworkErrorModal;
