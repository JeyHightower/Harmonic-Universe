import React from 'react';
import { Modal } from 'antd';
import Settings from './Settings';

const SettingsModal = ({ visible, onClose }) => {
  return (
    <Modal title="Settings" open={visible} onCancel={onClose} footer={null} width={800}>
      <Settings />
    </Modal>
  );
};

export default SettingsModal;
