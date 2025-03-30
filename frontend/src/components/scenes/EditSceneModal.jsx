import React from "react";
import { Modal } from "antd";
import SceneFormModal from "./SceneFormModal";

const EditSceneModal = ({ visible, onClose, onSubmit, initialData }) => {
  return (
    <Modal
      title="Edit Scene"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <SceneFormModal
        onSubmit={onSubmit}
        onCancel={onClose}
        initialData={initialData}
        isEdit
      />
    </Modal>
  );
};

export default EditSceneModal;
