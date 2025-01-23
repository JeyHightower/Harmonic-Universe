import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { login } from '../../store/slices/authSlice';
import styles from './Auth.module.css';

const Login = () => {
  const location = useLocation();
  const authState = useSelector(state => state.auth);

  useEffect(() => {
    // Monitor auth state changes
    if (authState?.isAuthenticated) {
      navigate('/');
    }
  }, [location, authState]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    return newErrors;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      const result = await dispatch(login(formData));
      if (result.error) {
        throw new Error(result.error.message || 'Login failed');
      }
      navigate('/');
    } catch (error) {
      setErrors({
        submit: error.message || 'Login failed. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer} data-testid="login-container">
      <form onSubmit={handleSubmit} className={styles.authForm}>
        <h2>Login</h2>
        <div className={styles.formGroup}>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className={errors.email ? styles.error : ''}
            data-testid="email-input"
          />
          {errors.email && (
            <span className={styles.errorText} data-testid="email-error">
              {errors.email}
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
            className={errors.password ? styles.error : ''}
            data-testid="password-input"
          />
          {errors.password && (
            <span className={styles.errorText} data-testid="password-error">
              {errors.password}
            </span>
          )}
        </div>
        {errors.submit && (
          <div className={styles.errorText} data-testid="submit-error">
            {errors.submit}
          </div>
        )}
        <button
          type="submit"
          className={styles.authButton}
          disabled={isLoading}
          data-testid="login-button"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export { Login };
