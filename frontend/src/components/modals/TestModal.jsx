import { Button, Form, Input } from 'antd';
import PropTypes from 'prop-types';
import { useState } from 'react';

/**
 * A simple test modal component to verify modal interaction works correctly
 */
const TestModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = () => {
    console.log('Form submitted with:', formData);
    onClose();
  };

  return (
    <div className="test-modal" onClick={(e) => e.stopPropagation()}>
      <h2>Test Modal</h2>
      <p>This is a test modal to verify click interactions work correctly.</p>
      <p>Try interacting with the form elements below:</p>

      <Form layout="vertical">
        <Form.Item label="Name">
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
            onClick={(e) => e.stopPropagation()}
          />
        </Form.Item>

        <Form.Item label="Email">
          <Input
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            onClick={(e) => e.stopPropagation()}
          />
        </Form.Item>

        <div className="button-group">
          <Button type="primary" onClick={handleSubmit}>
            Submit
          </Button>
          <Button onClick={onClose} style={{ marginLeft: '8px' }}>
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  );
};

TestModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default TestModal;
