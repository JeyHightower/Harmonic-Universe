import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { register } from '../../store/slices/authSlice';
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
    setFormErrors(prev => ({
      ...prev,
      [name]: '',
    }));
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
    if (formData.password !== formData.confirmPassword) {
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
        // Error handling is done in the slice
      }
    }
  };

  return (
    <div className={styles.authContainer} data-testid="register-container">
      <form className={styles.authForm} onSubmit={handleSubmit}>
        <h2>Register</h2>
        <div className={styles.formGroup}>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            data-testid="username-input"
          />
          {formErrors.username && (
            <div className={styles.error} data-testid="username-error">
              {formErrors.username}
            </div>
          )}
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            data-testid="email-input"
          />
          {formErrors.email && (
            <div className={styles.error} data-testid="email-error">
              {formErrors.email}
            </div>
          )}
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            data-testid="password-input"
          />
          {formErrors.password && (
            <div className={styles.error} data-testid="password-error">
              {formErrors.password}
            </div>
          )}
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            data-testid="confirm-password-input"
          />
          {formErrors.confirmPassword && (
            <div className={styles.error} data-testid="confirm-password-error">
              {formErrors.confirmPassword}
            </div>
          )}
        </div>
        {error && (
          <div className={styles.error} data-testid="submit-error">
            {error.message || error}
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
          <a href="/login">Already have an account? Login</a>
        </div>
      </form>
    </div>
  );
};

export { Register };
