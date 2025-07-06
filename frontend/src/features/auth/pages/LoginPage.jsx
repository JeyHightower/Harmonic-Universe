import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { demoLogin } from '../../../store/thunks/authThunks';
import Logger from '../../../utils/logger';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirect = location.state?.from?.pathname || '/dashboard';
      navigate(redirect, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleDemoLogin = useCallback(async () => {
    console.error('LoginPage - handleDemoLogin called');
    console.log('startting demo login');
    try {
      Logger.log('auth', 'LoginPage - Starting demo login process');
      setLoading(true);
      setError(null);

      console.error('LoginPage - About to dispatch demoLogin');
      const result = await dispatch(demoLogin()).unwrap();
      console.error('LoginPage - demoLogin result:', result);

      if (result?.success) {
        Logger.log('auth', 'LoginPage - Demo login successful');
        console.error('LoginPage - Demo login successful');
        setLoading(false);
      } else {
        throw new Error('Demo login failed');
      }
    } catch (error) {
      Logger.log('auth', 'LoginPage - Error during demo login:', { error: error.message });
      console.error('LoginPage - Demo login error:', error);
      setError('Failed to log in. Please try again.');
      setLoading(false);
    }
  }, [dispatch]);

  // Auto-start demo login
  useEffect(() => {
    handleDemoLogin();
  }, [handleDemoLogin]);

  return (
    <div className="login-page">
      <div className="auth-container">
        <div className="auth-card">
          <h2>Demo Login</h2>
          {loading ? (
            <>
              <p>Logging you in automatically...</p>
              <div className="loading-spinner"></div>
            </>
          ) : error ? (
            <>
              <p className="error-message">{error}</p>
              <button onClick={handleDemoLogin} className="button button-primary">
                Try Again
              </button>
            </>
          ) : (
            <p>Login successful! Redirecting to dashboard...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
