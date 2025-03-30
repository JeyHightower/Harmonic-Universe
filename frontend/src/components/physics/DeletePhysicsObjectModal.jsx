import React from "react";
import { Modal, Typography } from "antd";
import ConfirmDeleteWrapper from "../common/ConfirmDeleteWrapper";

const { Text } = Typography;

const DeletePhysicsObjectModal = ({
  visible,
  onClose,
  onConfirm,
  objectName,
}) => {
  return (
    <Modal
      title="Delete Physics Object"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <ConfirmDeleteWrapper
        onConfirm={onConfirm}
        onCancel={onClose}
        title={`Delete ${objectName || "Physics Object"}`}
      >
        <Text>
          Are you sure you want to delete this physics object? This action
          cannot be undone.
        </Text>
      </ConfirmDeleteWrapper>
    </Modal>
  );
};

export default DeletePhysicsObjectModal;
