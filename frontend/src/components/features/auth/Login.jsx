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
      const response = await api.post('/auth/login', values);
      dispatch(loginSuccess(response.user));
      navigate('/dashboard');
    } catch (error) {
      dispatch(loginFailure(error.message));
      dispatch(
        openModal({
          title: 'Login Error',
          content:
            error.message ||
            'An error occurred during login. Please try again.',
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
