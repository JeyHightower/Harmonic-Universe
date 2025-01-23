import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { resetPassword } from '../authSlice';
import styles from './Auth.module.css';

const ResetPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    email: '',
  });

  const [formErrors, setFormErrors] = useState({
    email: '',
  });

  const [success, setSuccess] = useState('');

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
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const result = await dispatch(resetPassword(formData.email)).unwrap();
        setSuccess(result.message);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err) {
        setFormErrors(prev => ({
          ...prev,
          submit: err.message || 'Password reset request failed',
        }));
      }
    }
  };

  return (
    <div
      className={styles.authContainer}
      data-testid="reset-password-container"
    >
      <form onSubmit={handleSubmit} className={styles.authForm}>
        <h2>Reset Password</h2>
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
        {success && (
          <div className={styles.successText} data-testid="submit-success">
            {success}
          </div>
        )}
        {(formErrors.submit || error) && (
          <div className={styles.errorText} data-testid="submit-error">
            {formErrors.submit || error}
          </div>
        )}
        <button
          type="submit"
          className={styles.authButton}
          data-testid="reset-button"
        >
          Reset Password
        </button>
        <div className={styles.authLinks}>
          <a href="/login">Back to Login</a>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
