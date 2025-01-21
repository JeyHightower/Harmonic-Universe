import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { resetPassword } from '../../store/slices/authSlice';
import styles from './Auth.module.css';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    email: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await dispatch(resetPassword(formData)).unwrap();
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setErrors({
        submit:
          error.message || 'Password reset request failed. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={styles.authContainer}
      data-testid="reset-password-container"
    >
      <form onSubmit={handleSubmit} className={styles.authForm}>
        <h2>Reset Password</h2>

        {success ? (
          <div className={styles.success}>
            Reset instructions sent
            <p>You will be redirected to login page shortly...</p>
          </div>
        ) : (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                data-testid="email-input"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.email && (
                <span className={styles.error}>{errors.email}</span>
              )}
            </div>

            {errors.submit && (
              <div className={styles.error}>{errors.submit}</div>
            )}

            <button
              type="submit"
              data-testid="reset-button"
              disabled={isLoading}
              className={styles.authButton}
            >
              {isLoading ? 'Sending...' : 'Reset Password'}
            </button>
          </>
        )}

        <div className={styles.authLinks}>
          <a href="/login">Back to Login</a>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
