import React from "react";
import { Modal } from "antd";
import UniverseFormModal from "./UniverseFormModal";

const CreateUniverseModal = ({ visible, onClose, onSubmit }) => {
  return (
    <Modal
      title="Create Universe"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <UniverseFormModal onSubmit={onSubmit} onCancel={onClose} />
    </Modal>
  );
};

export default CreateUniverseModal;
