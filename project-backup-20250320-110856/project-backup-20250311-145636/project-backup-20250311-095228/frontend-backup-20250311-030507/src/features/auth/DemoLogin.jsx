import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { demoLogin } from '../../store/thunks/authThunks';
import './Auth.css';

function DemoLogin() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Automatically trigger demo login when component mounts
        handleDemoLogin();
    }, []);

    const handleDemoLogin = async () => {
        try {
            // Show loading indicator or message
            console.log('Logging in as demo user...');
            setIsLoading(true);
            setError(null);

            // Dispatch the demo login action
            const resultAction = await dispatch(demoLogin());
            console.log('Demo login result:', resultAction);

            if (demoLogin.fulfilled.match(resultAction)) {
                console.log('Demo login successful, navigating to dashboard');
                // Demo login successful, navigate to dashboard
                navigate('/dashboard');
            } else {
                // Demo login failed, show error
                console.error('Demo login failed:', resultAction.payload);
                setError(resultAction.payload?.message || 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Error during demo login:', error);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRetry = () => {
        handleDemoLogin();
    };

    return (
        <div className="auth-container">
            <div className="auth-form">
                <h1>Demo Login</h1>
                {isLoading ? (
                    <>
                        <p>Logging you in as a demo user...</p>
                        <div className="loading-spinner"></div>
                    </>
                ) : error ? (
                    <>
                        <p className="error-message">{error}</p>
                        <button
                            onClick={handleRetry}
                            className="button button-primary"
                        >
                            Retry Login
                        </button>
                    </>
                ) : (
                    <p>Redirecting to dashboard...</p>
                )}
            </div>
        </div>
    );
}

export default DemoLogin;
