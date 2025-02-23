import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  loginFailure,
  loginStart,
  loginSuccess,
} from '../../../store/slices/authSlice';
import { openModal } from '../../../store/slices/modalSlice';
import { api } from '../../../utils/api';
import Button from '../../common/Button';
import './Home.css';

function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useSelector(state => state.auth);

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleDemoLogin = async () => {
    try {
      dispatch(loginStart());
      const response = await api.post('/api/auth/demo-login');

      // Store tokens first
      if (response.access_token) {
        localStorage.setItem('accessToken', response.access_token);
      }
      if (response.refresh_token) {
        localStorage.setItem('refreshToken', response.refresh_token);
      }

      // Then update the auth state
      dispatch(loginSuccess(response.user));
      navigate('/dashboard', { replace: true });
    } catch (error) {
      let errorMessage =
        'An error occurred during demo login. Please try again.';

      if (error.response) {
        const { data } = error.response;
        if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        }
      }

      dispatch(loginFailure(errorMessage));
      dispatch(
        openModal({
          title: 'Demo Login Error',
          content: errorMessage,
          actionType: 'RETRY_DEMO_LOGIN',
          severity: 'error',
          showCancel: true,
        })
      );
    }
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Welcome to Harmonic Universe</h1>
        <p>Experience the harmony of sound and physics in a unique way.</p>
        <div className="home-actions">
          <Button onClick={handleDemoLogin} variant="primary">
            Try Demo
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Home;
