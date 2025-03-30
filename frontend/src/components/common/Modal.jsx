import React from "react";
import PropTypes from "prop-types";
import "../../styles/Modal.css";

const Modal = ({ isOpen, onClose, children, type }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  type: PropTypes.string,
};

export default Modal;
