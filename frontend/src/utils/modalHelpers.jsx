import React from 'react';
import Button from '../components/common/Button';
import '../components/common/ModalContent.css';

// Alert Modal Component
export const AlertModal = ({ message, onClose, title = 'Alert' }) => {
  return (
    <div className="alert-modal-content">
      <p>{message}</p>
      <div className="modal-actions">
        <Button onClick={onClose}>OK</Button>
      </div>
    </div>
  );
};

// Confirmation Modal Component
export const ConfirmModal = ({
  message,
  onConfirm,
  onClose,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  title = 'Confirm',
  isDestructive = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="confirm-modal-content">
      <p>{message}</p>
      <div className="modal-actions">
        <Button
          variant={isDestructive ? 'danger' : 'primary'}
          onClick={handleConfirm}
        >
          {confirmText}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          {cancelText}
        </Button>
      </div>
    </div>
  );
};

// Form Modal Wrapper Component
export const FormModal = ({
  children,
  onClose,
  onSubmit,
  submitText = 'Submit',
  cancelText = 'Cancel',
  isSubmitting = false,
}) => {
  const handleSubmit = e => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="form-modal-content">
      {children}
      <div className="modal-actions">
        <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
          {submitText}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isSubmitting}
        >
          {cancelText}
        </Button>
      </div>
    </form>
  );
};

// Modal Helper Functions (to be used with useModal hook)
export const createAlertModal = (message, options = {}) => ({
  component: AlertModal,
  props: {
    message,
    title: options.title || 'Alert',
  },
  modalProps: {
    title: options.title || 'Alert',
    size: options.size || 'small',
    type: 'alert',
    animation: options.animation || 'fade',
    position: options.position || 'center',
  },
});

export const createConfirmModal = (message, onConfirm, options = {}) => ({
  component: ConfirmModal,
  props: {
    message,
    onConfirm,
    confirmText: options.confirmText || 'Confirm',
    cancelText: options.cancelText || 'Cancel',
    isDestructive: options.isDestructive || false,
  },
  modalProps: {
    title: options.title || 'Confirm',
    size: options.size || 'small',
    type: 'confirm',
    animation: options.animation || 'fade',
    position: options.position || 'center',
    preventBackdropClick: options.preventBackdropClick || true,
  },
});

export const createFormModal = (
  FormComponent,
  formProps = {},
  options = {}
) => ({
  component: props => (
    <FormModal
      onSubmit={formProps.onSubmit}
      submitText={options.submitText || 'Submit'}
      cancelText={options.cancelText || 'Cancel'}
      isSubmitting={formProps.isSubmitting || false}
      onClose={props.onClose}
    >
      <FormComponent {...formProps} onClose={props.onClose} />
    </FormModal>
  ),
  props: {},
  modalProps: {
    title: options.title || 'Form',
    size: options.size || 'medium',
    type: 'form',
    animation: options.animation || 'slide',
    position: options.position || 'center',
    preventBackdropClick:
      options.preventBackdropClick || formProps.isSubmitting || false,
  },
});
