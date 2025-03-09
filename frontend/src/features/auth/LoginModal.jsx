import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice';
import { api, endpoints } from '../../utils/api';
import { validateEmail, validatePassword } from '../../utils/validation';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import './Auth.css';

const LoginModal = ({ onClose }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [values, setValues] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({ email: '', password: '' });
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
            dispatch(loginStart());

            const response = await api.post(endpoints.auth.login, values);
            console.debug('Login response:', response);

            // Store tokens
            if (response.access_token) {
                localStorage.setItem('accessToken', response.access_token);
            }
            if (response.refresh_token) {
                localStorage.setItem('refreshToken', response.refresh_token);
            }

            // Fetch user info if not included in response
            let userData = response.user;
            if (!userData) {
                try {
                    const userResponse = await api.get(endpoints.auth.me);
                    userData = userResponse;
                } catch (error) {
                    console.error('Failed to fetch user info:', error);
                }
            }

            // Dispatch login success with user data
            dispatch(loginSuccess(userData || {}));

            // Close modal and navigate to dashboard
            onClose();
            navigate('/dashboard');
        } catch (error) {
            console.error('Login error:', error);

            // Extract error message
            let errorMessage = 'An error occurred during login. Please try again.';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            }

            dispatch(loginFailure(errorMessage));

            // Show error in form
            setErrors({
                ...errors,
                form: errorMessage
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-modal">
            <form onSubmit={handleSubmit} className="auth-form">
                <h2>Log In</h2>

                {errors.form && (
                    <div className="error-message form-error">{errors.form}</div>
                )}

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

                <div className="form-actions">
                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        disabled={isLoading}
                        loading={isLoading}
                    >
                        {isLoading ? 'Logging in...' : 'Log In'}
                    </Button>
                </div>

                <div className="form-footer">
                    <p>Don't have an account? <a href="#" onClick={(e) => {
                        e.preventDefault();
                        onClose();
                        // This should be replaced with a proper modal switch mechanism
                        setTimeout(() => {
                            document.querySelector('.register-button').click();
                        }, 100);
                    }}>Sign up</a></p>
                </div>
            </form>
        </div>
    );
};

export default LoginModal;
