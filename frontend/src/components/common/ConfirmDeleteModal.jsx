import React from "react";
import { Modal, Button, Typography } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

const ConfirmDeleteModal = ({
  visible,
  onCancel,
  onConfirm,
  title,
  children,
  confirmLoading = false,
}) => {
  return (
    <Modal
      title={
        <span>
          <ExclamationCircleOutlined
            style={{ color: "#ff4d4f", marginRight: 8 }}
          />
          {title}
        </span>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          danger
          onClick={onConfirm}
          loading={confirmLoading}
        >
          Delete
        </Button>,
      ]}
      width={500}
    >
      {children}
    </Modal>
  );
};

export default ConfirmDeleteModal;
