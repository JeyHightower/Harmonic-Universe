import React from "react";
import PropTypes from "prop-types";
import { ModalSystem } from "./index.mjs";

const FormModal = ({
  title,
  children,
  onSubmit,
  onCancel,
  onClose,
  ...props
}) => {
  return (
    <ModalSystem type="form" title={title} onClose={onClose} {...props}>
      <div className="modal-content">{children}</div>
    </ModalSystem>
  );
};

FormModal.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  onClose: PropTypes.func.isRequired,
};

export default FormModal;
