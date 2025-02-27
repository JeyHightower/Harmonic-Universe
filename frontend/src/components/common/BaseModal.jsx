import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'antd';
import { useModal } from '../../contexts/ModalContext';
import './BaseModal.css';

const BaseModal = ({
  title,
  children,
  footer = null,
  width = 520,
  centered = true,
  destroyOnClose = true,
  maskClosable = true,
  className = '',
  modalType = 'default',
  onOk,
  onCancel,
  confirmLoading = false,
  visible,
  customProps = {},
}) => {
  const { closeModal } = useModal();

  // Handle modal close
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    closeModal();
  };

  // Handle modal submission
  const handleOk = async () => {
    if (onOk) {
      await onOk();
    }
  };

  return (
    <Modal
      title={title}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={confirmLoading}
      centered={centered}
      destroyOnClose={destroyOnClose}
      maskClosable={maskClosable}
      footer={footer}
      width={width}
      className={`base-modal ${modalType}-modal ${className}`}
      {...customProps}
    >
      <div className="base-modal-content">{children}</div>
    </Modal>
  );
};

BaseModal.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  centered: PropTypes.bool,
  destroyOnClose: PropTypes.bool,
  maskClosable: PropTypes.bool,
  className: PropTypes.string,
  modalType: PropTypes.oneOf(['default', 'form', 'confirm', 'info', 'success', 'warning', 'error']),
  onOk: PropTypes.func,
  onCancel: PropTypes.func,
  confirmLoading: PropTypes.bool,
  visible: PropTypes.bool.isRequired,
  customProps: PropTypes.object,
};

export default BaseModal;
