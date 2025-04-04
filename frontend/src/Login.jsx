import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import useForm from '../../../hooks/useForm';
import {
  loginFailure,
  loginStart,
  loginSuccess,
} from '../../../store/slices/authSlice';
import { openModal } from '../../../store/slices/modalSlice';
import { api, endpoints } from '../../../utils/api';
import { validateEmail, validatePassword } from '../../../utils/validation';
import Button from '../../common/Button';
import Input from '../../common/Input';
import './Auth.css';

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { values, errors, handleChange, handleBlur, validateForm } = useForm(
    {
      email: '',
      password: '',
    },
    {
      email: validateEmail,
      password: validatePassword,
    }
  );

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      dispatch(loginStart());
      const response = await api.post(endpoints.auth.login, values);
      console.debug('Login response:', response);

      if (response.access_token) {
        localStorage.setItem('accessToken', response.access_token);
      }
      if (response.refresh_token) {
        localStorage.setItem('refreshToken', response.refresh_token);
      }

      // Force navigation to dashboard immediately after setting tokens
      console.debug('Forcing navigation to dashboard');

      // Fetch user info after successful login
      try {
        const userResponse = await api.get(endpoints.auth.me);
        console.debug('User info response:', userResponse);
        dispatch(loginSuccess(userResponse));
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        // Continue with navigation even if user info fetch fails
      }

      // Try multiple navigation methods to ensure we get to the dashboard

      // Method 1: Use React Router navigate with explicit path
      console.debug('Attempting navigation with React Router');
      navigate('/dashboard', { replace: true });

      // Method 2: Use direct navigation after a short delay with full URL
      setTimeout(() => {
        console.debug('Attempting direct navigation to dashboard');
        // Ensure we're using the correct origin without appending /api
        const origin = window.location.origin;
        const dashboardUrl = `${origin}/dashboard`;
        console.debug('Dashboard URL:', dashboardUrl);
        window.location.href = dashboardUrl;
      }, 500);
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'An error occurred during login. Please try again.';

      if (error.response) {
        const { data } = error.response;
        if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        }
      }

      dispatch(loginFailure(errorMessage));
      dispatch(
        openModal({
          title: 'Login Error',
          content: errorMessage,
          severity: 'error',
        })
      );
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h1>Login</h1>
        <p className="auth-description">Welcome back! Sign in to continue your journey.</p>
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
        <Button type="submit" fullWidth>
          Login
        </Button>
        <div className="auth-links">
          <p>Don't have an account? <Link to="/register" className="auth-link">Register here</Link></p>
        </div>
      </form>
    </div>
  );
}

export default Login;
