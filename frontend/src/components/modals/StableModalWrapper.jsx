import PropTypes from "prop-types";
import React from "react";
import { Modal } from "antd";
import { log } from "../../utils/logger";
import "./Modal.css";

// This component ensures that modal instances remain stable
// and don't re-render unnecessarily
const StableModalWrapper = ({ title, children, onClose, width = 520 }) => {
  const handleClose = () => {
    log("modal", "Modal closed", { title });
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      title={title}
      open={true}
      onCancel={handleClose}
      footer={null}
      width={width}
      destroyOnClose={true}
      maskClosable={false}
      className="stable-modal"
    >
      {children}
    </Modal>
  );
};

StableModalWrapper.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func,
  width: PropTypes.number,
};

export default StableModalWrapper;
