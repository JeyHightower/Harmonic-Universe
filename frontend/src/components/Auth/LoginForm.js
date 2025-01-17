import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginStart, loginSuccess, loginFail } from '../../redux/slices/authSlice';
import { login } from '../../services/authService';
import useForm from '../../hooks/useForm';
import styles from './Auth.module.css';
import { validateEmail, validatePassword } from '../../utils/validations';

const LoginForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const validations = {
    email: {
      required: true,
      validate: validateEmail
    },
    password: {
      required: true,
      validate: validatePassword
    }
  };

  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit
  } = useForm(
    { email: '', password: '' },
    validations
  );

  const onSubmit = async (formData) => {
    try {
      dispatch(loginStart());
      const response = await login(formData);
      dispatch(loginSuccess(response));
      navigate('/dashboard');
    } catch (error) {
      dispatch(loginFail(error.message));
      throw error;
    }
  };

  return (
    <div className={styles.formContainer}>
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(onSubmit);
      }}>
        <div className={styles.formGroup}>
          <input
            type="email"
            name="email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={styles.input}
            placeholder="Email"
          />
          {errors.email && (
            <div className={styles.error}>{errors.email}</div>
          )}
        </div>

        <div className={styles.formGroup}>
          <input
            type="password"
            name="password"
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            className={styles.input}
            placeholder="Password"
          />
          {errors.password && (
            <div className={styles.error}>{errors.password}</div>
          )}
        </div>

        {errors.submit && (
          <div className={styles.error}>{errors.submit}</div>
        )}

        <button
          type="submit"
          className={styles.button}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
