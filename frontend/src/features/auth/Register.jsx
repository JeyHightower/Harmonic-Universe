import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { register } from '../authSlice';
import styles from './Auth.module.css';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.username) {
      errors.username = 'Username is required';
    }
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const result = await dispatch(register(formData)).unwrap();
        if (result.token) {
          navigate('/dashboard');
        }
      } catch (err) {
        setFormErrors(prev => ({
          ...prev,
          submit: err.message || 'Registration failed',
        }));
      }
    }
  };

  return (
    <div className={styles.authContainer} data-testid="register-container">
      <form onSubmit={handleSubmit} className={styles.authForm}>
        <h2>Register</h2>
        <div className={styles.formGroup}>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Username"
            className={formErrors.username ? styles.error : ''}
            data-testid="username-input"
          />
          {formErrors.username && (
            <span className={styles.errorText} data-testid="username-error">
              {formErrors.username}
            </span>
          )}
        </div>
        <div className={styles.formGroup}>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className={formErrors.email ? styles.error : ''}
            data-testid="email-input"
          />
          {formErrors.email && (
            <span className={styles.errorText} data-testid="email-error">
              {formErrors.email}
            </span>
          )}
        </div>
        <div className={styles.formGroup}>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            className={formErrors.password ? styles.error : ''}
            data-testid="password-input"
          />
          {formErrors.password && (
            <span className={styles.errorText} data-testid="password-error">
              {formErrors.password}
            </span>
          )}
        </div>
        <div className={styles.formGroup}>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm Password"
            className={formErrors.confirmPassword ? styles.error : ''}
            data-testid="confirm-password-input"
          />
          {formErrors.confirmPassword && (
            <span
              className={styles.errorText}
              data-testid="confirm-password-error"
            >
              {formErrors.confirmPassword}
            </span>
          )}
        </div>
        {(formErrors.submit || error) && (
          <div className={styles.errorText} data-testid="submit-error">
            {formErrors.submit || error}
          </div>
        )}
        <button
          type="submit"
          className={styles.authButton}
          data-testid="register-button"
        >
          Register
        </button>
        <div className={styles.authLinks}>
          <a href="/login">Already have an account? Sign in</a>
        </div>
      </form>
    </div>
  );
};

export default Register;
