import { useDispatch, useSelector } from 'react-redux';
import useForm from '../../hooks/useForm';
import { updateUser } from '../../store/slices/userSlice';
import { validateEmail } from '../../utils/validations';
import styles from './Profile.module.css';

const UserProfile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const validations = {
    username: {
      required: true,
      validate: value => ({
        isValid: value.length >= 3,
        errors: ['Username must be at least 3 characters long'],
      }),
    },
    email: {
      required: true,
      validate: validateEmail,
    },
    bio: {
      validate: value => ({
        isValid: value.length <= 500,
        errors: ['Bio must be less than 500 characters'],
      }),
    },
  };

  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
  } = useForm(
    {
      username: user?.username || '',
      email: user?.email || '',
      bio: user?.bio || '',
    },
    validations
  );

  const onSubmit = async formData => {
    try {
      await dispatch(updateUser(formData)).unwrap();
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className={styles.profileContainer}>
      <h2 className={styles.title}>Edit Profile</h2>
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSubmit(onSubmit);
        }}
      >
        <div className={styles.formGroup}>
          <label>Username</label>
          <input
            type="text"
            name="username"
            value={values.username}
            onChange={handleChange}
            onBlur={handleBlur}
            className={styles.input}
          />
          {errors.username && (
            <div className={styles.error}>{errors.username}</div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={styles.input}
          />
          {errors.email && <div className={styles.error}>{errors.email}</div>}
        </div>

        <div className={styles.formGroup}>
          <label>Bio</label>
          <textarea
            name="bio"
            value={values.bio}
            onChange={handleChange}
            onBlur={handleBlur}
            className={styles.textarea}
            rows="4"
          />
          {errors.bio && <div className={styles.error}>{errors.bio}</div>}
        </div>

        {errors.submit && <div className={styles.error}>{errors.submit}</div>}

        <button type="submit" className={styles.button} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default UserProfile;
