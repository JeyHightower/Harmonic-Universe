import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import useForm from '../../../hooks/useForm';
import {
  loginFailure,
  loginStart,
  loginSuccess,
} from '../../../store/slices/authSlice';
import { openModal } from '../../../store/slices/modalSlice';
import { api } from '../../../utils/api';
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
      const response = await api.post('/api/auth/login', values);

      if (response.access_token) {
        localStorage.setItem('accessToken', response.access_token);
      }
      if (response.refresh_token) {
        localStorage.setItem('refreshToken', response.refresh_token);
      }

      dispatch(loginSuccess(response.user));
      navigate('/dashboard');
    } catch (error) {
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
      </form>
    </div>
  );
}

export default Login;
