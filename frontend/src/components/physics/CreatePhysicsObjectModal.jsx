import React from "react";
import { Modal } from "antd";
import PhysicsObjectForm from "./PhysicsObjectForm";

const CreatePhysicsObjectModal = ({ visible, onClose, onSubmit }) => {
  return (
    <Modal
      title="Create Physics Object"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <PhysicsObjectForm onSubmit={onSubmit} onCancel={onClose} />
    </Modal>
  );
};

export default CreatePhysicsObjectModal;
