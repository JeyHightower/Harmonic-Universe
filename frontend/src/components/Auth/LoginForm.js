import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import useForm from '../../hooks/useForm';
import {
  loginFail,
  loginStart,
  loginSuccess,
} from '../../redux/slices/authSlice';
import { authService } from '../../services/authService';
import { validateEmail, validatePassword } from '../../utils/validations';
import styles from './Auth.module.css';

const LoginForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const validations = {
    email: {
      required: true,
      validate: validateEmail,
    },
    password: {
      required: true,
      validate: validatePassword,
    },
  };

  const { formData, errors, handleChange, handleSubmit } = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validations,
    onSubmit: async values => {
      try {
        dispatch(loginStart());
        const response = await authService.login(values);
        dispatch(loginSuccess(response));
        navigate('/dashboard');
      } catch (error) {
        dispatch(loginFail(error.message));
      }
    },
  });

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={errors.email ? styles.error : ''}
        />
        {errors.email && (
          <span className={styles.errorMessage}>{errors.email}</span>
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
          className={errors.password ? styles.error : ''}
        />
        {errors.password && (
          <span className={styles.errorMessage}>{errors.password}</span>
        )}
      </div>

      <button type="submit" className={styles.submitButton}>
        Login
      </button>
    </form>
  );
};

export default LoginForm;
