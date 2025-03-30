import React from "react";
import { Modal, Typography } from "antd";
import ConfirmDeleteWrapper from "../common/ConfirmDeleteWrapper";

const { Text } = Typography;

const DeleteUniverseModal = ({ visible, onClose, onConfirm, universeName }) => {
  return (
    <Modal
      title="Delete Universe"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <ConfirmDeleteWrapper
        onConfirm={onConfirm}
        onCancel={onClose}
        title={`Delete ${universeName || "Universe"}`}
      >
        <Text>
          Are you sure you want to delete this universe? This action cannot be
          undone.
        </Text>
      </ConfirmDeleteWrapper>
    </Modal>
  );
};

export default DeleteUniverseModal;
