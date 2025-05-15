import { Form, Input, message } from 'antd';
import PropTypes from 'prop-types';
import { useEffect, useId, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/common/Button';
import { register } from '../../../store/thunks/authThunks';
import { log } from '../../../utils/logger';
import { validateEmail, validatePassword, validateUsername } from '../../../utils/validation';
import '../styles/Auth.css';

const SignupModal = ({ onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const instanceId = useId();

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      log('auth', 'Attempting signup', { email: values.email });

      // Validate input
      const emailError = validateEmail(values.email);
      const passwordError = validatePassword(values.password);
      const usernameError = validateUsername(values.username);

      if (emailError || passwordError || usernameError) {
        throw new Error(emailError || passwordError || usernameError);
      }

      // Check if passwords match
      if (values.password !== values.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Convert email to lowercase and prepare signup data
      const signupData = {
        username: values.username,
        email: values.email.toLowerCase(),
        password: values.password,
      };

      const resultAction = await dispatch(register(signupData));

      if (register.fulfilled.match(resultAction)) {
        log('auth', 'Signup successful', { email: values.email });
        message.success('Signup successful!');

        // Clear form
        form.resetFields();

        // Use setTimeout to ensure the success message is shown before closing
        setTimeout(() => {
          onClose();

          // Dispatch a custom event to encourage components to refresh
          window.dispatchEvent(new CustomEvent('storage'));

          // Navigate to dashboard
          navigate('/dashboard');
        }, 500);
      } else {
        // Extract error message safely from the rejected action
        const errorMessage =
          typeof resultAction.payload === 'string'
            ? resultAction.payload
            : resultAction.payload?.message ||
              resultAction.error?.message ||
              'Signup failed. Please try again.';

        throw new Error(errorMessage);
      }
    } catch (error) {
      log('auth', 'Signup failed', { error: error.message });
      // Ensure we're displaying a string error message
      const errorMsg =
        typeof error === 'object'
          ? error.message || 'Signup failed. Please try again.'
          : error || 'Signup failed. Please try again.';

      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Reset form fields on mount
  useEffect(() => {
    form.resetFields();
  }, [form]);

  return (
    <div className="signup-modal-content">
      <Form form={form} onFinish={handleSubmit} layout="vertical" className="auth-form">
        <Form.Item
          label="Username"
          name="username"
          rules={[
            { required: true, message: 'Please input your username!' },
            { min: 3, message: 'Username must be at least 3 characters!' },
          ]}
        >
          <Input
            id={`signup-username-${instanceId}`}
            placeholder="Choose a username"
            disabled={loading}
          />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' },
          ]}
        >
          <Input
            id={`signup-email-${instanceId}`}
            placeholder="Enter your email"
            disabled={loading}
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: 'Please input your password!' },
            { min: 8, message: 'Password must be at least 8 characters!' },
            {
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
              message:
                'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
            },
          ]}
        >
          <Input.Password
            id={`signup-password-${instanceId}`}
            placeholder="Choose a password"
            disabled={loading}
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item
          label="Confirm Password"
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your password!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Passwords do not match!'));
              },
            }),
          ]}
        >
          <Input.Password
            id={`signup-confirm-password-${instanceId}`}
            placeholder="Confirm your password"
            disabled={loading}
            autoComplete="new-password"
          />
        </Form.Item>
      </Form>

      <div className="modal-actions">
        <Button onClick={onClose} disabled={loading} variant="secondary">
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => form.submit()}
          loading={loading}
          className="auth-button"
          disabled={loading}
        >
          Sign Up
        </Button>
      </div>
    </div>
  );
};

SignupModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default SignupModal;
