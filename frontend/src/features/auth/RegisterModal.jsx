import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../store/thunks/authThunks';
import { validateEmail, validatePassword, validateUsername } from '../../utils/validation';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import './Auth.css';

const RegisterModal = ({ onClose }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [values, setValues] = useState({ username: '', email: '', password: '' });
    const [errors, setErrors] = useState({ username: '', email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues(prev => ({ ...prev, [name]: value }));

        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Validate username
        const usernameError = validateUsername(values.username);
        if (usernameError) newErrors.username = usernameError;

        // Validate email
        const emailError = validateEmail(values.email);
        if (emailError) newErrors.email = emailError;

        // Validate password
        const passwordError = validatePassword(values.password);
        if (passwordError) newErrors.password = passwordError;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            // Dispatch the register action
            const resultAction = await dispatch(registerUser(values));

            if (registerUser.fulfilled.match(resultAction)) {
                // Registration successful
                onClose();
                navigate('/dashboard');
            } else {
                // Registration failed, show error
                const errorMessage = resultAction.payload?.message ||
                    'An error occurred during registration. Please try again.';

                setErrors({
                    ...errors,
                    form: errorMessage
                });
            }
        } catch (error) {
            console.error('Registration error:', error);

            setErrors({
                ...errors,
                form: 'An unexpected error occurred. Please try again.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-modal">
            <form onSubmit={handleSubmit} className="auth-form">
                <h2>Sign Up</h2>

                {errors.form && (
                    <div className="error-message form-error">{errors.form}</div>
                )}

                <div className="form-group">
                    <Input
                        type="text"
                        label="Username"
                        name="username"
                        value={values.username}
                        onChange={handleChange}
                        error={errors.username}
                        required
                    />
                </div>

                <div className="form-group">
                    <Input
                        type="email"
                        label="Email"
                        name="email"
                        value={values.email}
                        onChange={handleChange}
                        error={errors.email}
                        required
                    />
                </div>

                <div className="form-group">
                    <Input
                        type="password"
                        label="Password"
                        name="password"
                        value={values.password}
                        onChange={handleChange}
                        error={errors.password}
                        required
                    />
                </div>

                <div className="password-requirements">
                    <p>Password requirements:</p>
                    <ul>
                        <li className={values.password.length >= 8 ? 'requirement-met' : ''}>
                            At least 8 characters
                        </li>
                        <li className={/[A-Z]/.test(values.password) ? 'requirement-met' : ''}>
                            At least one uppercase letter
                        </li>
                        <li className={/[a-z]/.test(values.password) ? 'requirement-met' : ''}>
                            At least one lowercase letter
                        </li>
                        <li className={/[0-9]/.test(values.password) ? 'requirement-met' : ''}>
                            At least one number
                        </li>
                    </ul>
                </div>

                <div className="form-actions">
                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        disabled={isLoading}
                        loading={isLoading}
                    >
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </Button>
                </div>

                <div className="form-footer">
                    <p>Already have an account? <a href="#" onClick={(e) => {
                        e.preventDefault();
                        onClose();
                        // This should be replaced with a proper modal switch mechanism
                        setTimeout(() => {
                            document.querySelector('.login-button').click();
                        }, 100);
                    }}>Log in</a></p>
                </div>
            </form>
        </div>
    );
};

export default RegisterModal;
