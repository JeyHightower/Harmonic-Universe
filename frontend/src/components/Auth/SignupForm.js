import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginSuccess } from '../../redux/slices/authSlice';
import { signup } from '../../services/authService';
import useForm from '../../hooks/useForm';
import styles from './Auth.module.css';
import { validateEmail, validatePassword } from '../../utils/validations';

const SignupForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const validations = {
    username: {
      required: true,
      validate: (value) => ({
        isValid: value.length >= 3,
        errors: ['Username must be at least 3 characters long']
      })
    },
    email: {
      required: true,
      validate: validateEmail
    },
    password: {
      required: true,
      validate: validatePassword
    },
    confirmPassword: {
      required: true,
      validate: (value, formValues) => ({
        isValid: value === formValues.password,
        errors: ['Passwords do not match']
      })
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
    {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    validations
  );

  const onSubmit = async (formData) => {
    try {
      const response = await signup(formData);
      dispatch(loginSuccess(response));
      navigate('/dashboard');
    } catch (error) {
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
            type="text"
            name="username"
            value={values.username}
            onChange={handleChange}
            onBlur={handleBlur}
            className={styles.input}
            placeholder="Username"
          />
          {errors.username && (
            <div className={styles.error}>{errors.username}</div>
          )}
        </div>

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

        <div className={styles.formGroup}>
          <input
            type="password"
            name="confirmPassword"
            value={values.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            className={styles.input}
            placeholder="Confirm Password"
          />
          {errors.confirmPassword && (
            <div className={styles.error}>{errors.confirmPassword}</div>
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
          {isSubmitting ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
};

export default SignupForm;
