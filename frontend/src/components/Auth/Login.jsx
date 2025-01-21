import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { login } from '../../store/slices/authSlice';
import styles from './Auth.module.css';

const Login = () => {
  console.log('Login component rendering');
  const location = useLocation();
  const authState = useSelector(state => state.auth);

  useEffect(() => {
    console.log('Login component mounted');
    console.log('Current pathname:', location.pathname);
    console.log('Current search:', location.search);
    console.log('Current state:', location.state);
    console.log('Initial auth state:', authState);

    return () => {
      console.log('Login component unmounting');
    };
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
    console.log(`Updating ${name} field:`, value);
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
    console.log('Validating form data:', formData);
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    console.log('Validation errors:', newErrors);
    return newErrors;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    console.log('Form submission started');

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      console.log('Form validation failed:', validationErrors);
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      console.log('Dispatching login action with:', formData);
      const result = await dispatch(login(formData));
      if (result.error) {
        throw new Error(result.error.message || 'Login failed');
      }
      console.log('Login successful, navigating to home');
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
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

export default Login;
