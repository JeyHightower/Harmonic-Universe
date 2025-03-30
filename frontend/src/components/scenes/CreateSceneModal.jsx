import React from "react";
import { Modal } from "antd";
import SceneFormModal from "./SceneFormModal";

const CreateSceneModal = ({ visible, onClose, onSubmit }) => {
  return (
    <Modal
      title="Create Scene"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <SceneFormModal onSubmit={onSubmit} onCancel={onClose} />
    </Modal>
  );
};

export default CreateSceneModal;
