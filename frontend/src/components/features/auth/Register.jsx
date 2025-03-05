import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import useForm from '../../../hooks/useForm';
import { openModal } from '../../../store/slices/modalSlice';
import { registerUser } from '../../../store/thunks/authThunks';
import {
  validateEmail,
  validatePassword,
  validateUsername,
} from '../../../utils/validation';
import Button from '../../common/Button';
import Input from '../../common/Input';
import './Auth.css';

function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(state => state.auth);

  const { values, errors, handleChange, handleBlur, validateForm } = useForm(
    {
      username: '',
      email: '',
      password: '',
    },
    {
      username: validateUsername,
      email: validateEmail,
      password: validatePassword,
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      dispatch(
        openModal({
          title: 'Validation Error',
          content: 'Please fix the errors in the form before submitting.',
          severity: 'error',
        })
      );
      return;
    }

    try {
      const resultAction = await dispatch(registerUser(values));

      if (registerUser.fulfilled.match(resultAction)) {
        // Registration successful, navigate to dashboard
        navigate('/dashboard');
      } else {
        // Registration failed, show error in modal
        const errorMessage = resultAction.payload?.message ||
          'An error occurred during registration. Please try again.';

        dispatch(
          openModal({
            title: 'Registration Error',
            content: errorMessage,
            severity: 'error',
          })
        );
      }
    } catch (err) {
      console.error('Unexpected error during registration:', err);
      dispatch(
        openModal({
          title: 'Registration Error',
          content: 'An unexpected error occurred. Please try again.',
          severity: 'error',
        })
      );
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h1>Register</h1>
        <Input
          type="text"
          label="Username"
          name="username"
          value={values.username}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.username}
          required
        />
        <Input
          type="email"
          label="Email"
          name="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.email}
          required
        />
        <Input
          type="password"
          label="Password"
          name="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.password}
          required
        />
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </Button>
      </form>
    </div>
  );
}

export default Register;
