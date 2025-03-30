import React from "react";
import { Modal, Typography } from "antd";
import ConfirmDeleteWrapper from "../common/ConfirmDeleteWrapper";

const { Text } = Typography;

const DeleteSceneModal = ({ visible, onClose, onConfirm, sceneName }) => {
  return (
    <Modal
      title="Delete Scene"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <ConfirmDeleteWrapper
        onConfirm={onConfirm}
        onCancel={onClose}
        title={`Delete ${sceneName || "Scene"}`}
      >
        <Text>
          Are you sure you want to delete this scene? This action cannot be
          undone.
        </Text>
      </ConfirmDeleteWrapper>
    </Modal>
  );
};

export default DeleteSceneModal;
