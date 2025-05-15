import { useState } from 'react';
import { useModalRedux } from '../../hooks/useModal';
import { createAlertModal, createConfirmModal, createFormModal } from '../../utils/modalHelpers';
import { Button } from '../common';
import Input from '../common/Input';
import { DraggableModal } from './';
import './ModalExample.css';

// Example form component for the form modal
const ExampleForm = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <>
      <Input label="Name" name="name" value={formData.name} onChange={handleChange} required />
      <Input
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      <Input
        label="Message"
        name="message"
        type="textarea"
        value={formData.message}
        onChange={handleChange}
        required
      />
    </>
  );
};

/**
 * Modal example component for demonstrating different types of modals
 */
const ModalExample = () => {
  const { open } = useModalRedux();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [formResult, setFormResult] = useState(null);

  const showAlert = () => {
    open('ALERT', {
      title: 'Alert',
      message: 'This is an alert modal example.',
    });
  };

  const showConfirmation = () => {
    open('CONFIRMATION', {
      title: 'Confirm Action',
      message: 'Are you sure you want to proceed with this action?',
      confirmText: 'Yes, proceed',
      cancelText: 'No, cancel',
      onConfirm: () => setConfirmationResult('Action confirmed!'),
      onCancel: () => setConfirmationResult('Action cancelled.'),
    });
  };

  const handleDraggableOpen = () => {
    setIsOpen(true);
  };

  const handleDraggableClose = () => {
    setIsOpen(false);
  };

  const showFormModal = () => {
    open('FORM', {
      title: 'Contact Form',
      formComponent: ExampleForm,
      onSubmit: (data) => {
        setFormResult(JSON.stringify(data, null, 2));
      },
    });
  };

  const createModal = (type) => {
    const modalConfigs = {
      alert: createAlertModal('This is an example alert message.'),
      confirm: createConfirmModal('Are you sure you want to continue?', () =>
        console.log('Confirmed')
      ),
      form: createFormModal(ExampleForm, {
        onSubmit: (data) => console.log('Form submitted:', data),
      }),
    };

    const config = modalConfigs[type];
    if (!config) return;

    open(config.component, config.props);
  };

  return (
    <div className="modal-example">
      <h2>Modal Examples</h2>
      <div className="button-group">
        <Button onClick={showAlert}>Show Alert Modal</Button>
        <Button onClick={showConfirmation}>Show Confirmation Modal</Button>
        <Button onClick={showFormModal}>Show Form Modal</Button>
        <Button onClick={handleDraggableOpen}>Show Draggable Modal</Button>
      </div>

      {confirmationResult && (
        <div className="result-container">
          <h3>Confirmation Result:</h3>
          <p>{confirmationResult}</p>
        </div>
      )}

      {formResult && (
        <div className="result-container">
          <h3>Form Submission:</h3>
          <pre>{formResult}</pre>
        </div>
      )}

      <DraggableModal isOpen={isOpen} onClose={handleDraggableClose} title="Draggable Modal">
        <div>
          <p>This modal can be dragged around the screen by its header.</p>
          <p>Try clicking and dragging the header!</p>
        </div>
      </DraggableModal>
    </div>
  );
};

export default ModalExample;
