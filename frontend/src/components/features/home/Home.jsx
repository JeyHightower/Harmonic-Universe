import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  loginFailure,
  loginStart,
  loginSuccess,
} from '../../../store/slices/authSlice';
import { openModal } from '../../../store/slices/modalSlice';
import { api, endpoints } from '../../../utils/api';
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
      const response = await api.post(endpoints.auth.demoLogin);

      if (response && response.user) {
        // Store tokens if they exist
        if (response.access_token) {
          localStorage.setItem('accessToken', response.access_token);
        }
        if (response.refresh_token) {
          localStorage.setItem('refreshToken', response.refresh_token);
        }

        dispatch(loginSuccess(response.user));
        // Navigation will be handled by the useEffect hook
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      dispatch(loginFailure(error.message));
      dispatch(
        openModal({
          title: 'Demo Login Error',
          content: error.message || 'An error occurred during demo login.',
          actionType: 'RETRY_DEMO_LOGIN',
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
        <p>
          Experience the harmony of physics and music in a unique simulation
          environment.
        </p>
        <div className="home-actions">
          <Button onClick={handleDemoLogin} variant="primary" size="large">
            Try Demo
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Home;
