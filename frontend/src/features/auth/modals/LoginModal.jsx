import { Form, Input, message } from 'antd';
import PropTypes from 'prop-types';
import React, { useId, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../../components/common/Button.jsx';
import { login } from '../../../store/thunks/authThunks';
import { log } from '../../../utils/logger';
import '../styles/Auth.css';

const LoginModal = ({ onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { error } = useSelector((state) => state.auth);
  const instanceId = useId();

  // Use the provided onClose function
  const handleClose = () => {
    // Reset form fields
    form.resetFields();

    // Call the provided onClose function from ModalManager
    onClose();
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      log('auth', 'Attempting login', { email: values.email });

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(values.email)) {
        message.error('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Validate password
      if (!values.password || values.password.length < 6) {
        message.error('Password must be at least 6 characters long');
        setLoading(false);
        return;
      }

      // Prepare login data - map email to username as expected by the API
      const loginData = {
        username: values.email.toLowerCase(), // API expects username but we're using email
        password: values.password,
        email: values.email.toLowerCase(), // Also provide email for flexibility
      };

      const resultAction = await dispatch(login(loginData));

      if (login.fulfilled.match(resultAction)) {
        log('auth', 'Login successful', { email: values.email });
        message.success('Login successful!');

        // Clear any stale form data
        form.resetFields();

        // Use setTimeout to ensure the success message is shown before closing
        setTimeout(() => {
          handleClose();

          // Dispatch a custom event to encourage components to refresh
          window.dispatchEvent(new CustomEvent('storage'));
        }, 500);
      } else {
        const errorMessage = resultAction.error?.message || 'Invalid email or password';
        log('auth', 'Login failed', { error: errorMessage });

        // Handle specific error cases
        if (errorMessage.includes('Invalid email or password')) {
          message.error('Invalid email or password. Please try again.');
        } else if (errorMessage.includes('Email and password are required')) {
          message.error('Please enter both email and password.');
        } else if (errorMessage.includes('Invalid JSON format')) {
          message.error('An error occurred. Please try again.');
        } else {
          message.error(errorMessage);
        }

        form.setFieldValue('password', '');
      }
    } catch (error) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      log('auth', 'Login failed', { error: errorMessage });
      message.error(errorMessage);
      form.setFieldValue('password', '');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    form.resetFields();
  }, [form]);

  return (
    <div className="login-modal-content">
      <Form form={form} onFinish={handleSubmit} layout="vertical" className="auth-form">
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' },
          ]}
        >
          <Input
            id={`login-email-${instanceId}`}
            placeholder="Enter your email"
            autoComplete="email"
            disabled={loading}
          />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: 'Please input your password!' },
            { min: 8, message: 'Password must be at least 8 characters!' },
          ]}
        >
          <Input.Password
            id={`login-password-${instanceId}`}
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={loading}
          />
        </Form.Item>

        <div className="auth-form-actions">
          <Button onClick={handleClose} disabled={loading} variant="secondary">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => form.submit()}
            loading={loading}
            className="auth-button"
            disabled={loading}
          >
            Login
          </Button>
        </div>
      </Form>
    </div>
  );
};

LoginModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default LoginModal;
