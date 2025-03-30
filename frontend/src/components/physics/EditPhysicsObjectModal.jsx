import React from "react";
import { Modal } from "antd";
import PhysicsObjectForm from "./PhysicsObjectForm";

const EditPhysicsObjectModal = ({
  visible,
  onClose,
  onSubmit,
  initialData,
}) => {
  return (
    <Modal
      title="Edit Physics Object"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <PhysicsObjectForm
        onSubmit={onSubmit}
        onCancel={onClose}
        initialData={initialData}
        isEdit
      />
    </Modal>
  );
};

export default EditPhysicsObjectModal;
