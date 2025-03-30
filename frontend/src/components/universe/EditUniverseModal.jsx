import React from "react";
import { Modal } from "antd";
import UniverseFormModal from "./UniverseFormModal";

const EditUniverseModal = ({ visible, onClose, onSubmit, initialData }) => {
  return (
    <Modal
      title="Edit Universe"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <UniverseFormModal
        onSubmit={onSubmit}
        onCancel={onClose}
        initialData={initialData}
        isEdit
      />
    </Modal>
  );
};

export default EditUniverseModal;
