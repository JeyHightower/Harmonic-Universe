import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { demoLogin } from '../../store/thunks/authThunks';
import './Auth.css';

function DemoLogin() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        // Automatically trigger demo login when component mounts
        handleDemoLogin();
    }, []);

    const handleDemoLogin = async () => {
        try {
            // Show loading indicator or message
            console.log('Logging in as demo user...');

            // Dispatch the demo login action
            const resultAction = await dispatch(demoLogin());

            if (demoLogin.fulfilled.match(resultAction)) {
                // Demo login successful, navigate to dashboard
                navigate('/dashboard');
            } else {
                // Demo login failed, show error
                console.error('Demo login failed:', resultAction.payload);
            }
        } catch (error) {
            console.error('Error during demo login:', error);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form">
                <h1>Demo Login</h1>
                <p>Logging you in as a demo user...</p>
                <div className="loading-spinner"></div>
            </div>
        </div>
    );
}

export default DemoLogin;
