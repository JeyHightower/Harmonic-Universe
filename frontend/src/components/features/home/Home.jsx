import { Dropdown, Menu, Space } from 'antd';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { DownOutlined } from '../../../components/common/Icons';
import { ROUTES } from '../../../constants/routes';
import {
  checkAuthState,
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
  const buttonRef = useRef(null); // Add ref for the button to avoid findDOMNode

  useEffect(() => {
    console.debug('Home component mounted');
    dispatch(checkAuthState());
  }, [dispatch]);

  useEffect(() => {
    console.debug('Auth state updated:', { isAuthenticated, loading });
    if (isAuthenticated && !loading) {
      console.debug('Redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleDemoLogin = async () => {
    try {
      console.debug('Starting demo login');
      dispatch(loginStart());
      const response = await api.post(endpoints.auth.demoLogin);
      console.debug('Demo login response:', response);

      if (response.access_token) {
        localStorage.setItem('accessToken', response.access_token);
      }
      if (response.refresh_token) {
        localStorage.setItem('refreshToken', response.refresh_token);
      }

      // Force navigation to dashboard immediately after setting tokens
      console.debug('Forcing navigation to dashboard');

      // Dispatch login success with the user data from the response
      if (response.user) {
        dispatch(loginSuccess(response.user));
      } else {
        // If no user data in response, fetch it separately
        try {
          const userResponse = await api.get(endpoints.auth.me);
          console.debug('User info response:', userResponse);
          dispatch(loginSuccess(userResponse));
        } catch (error) {
          console.error('Failed to fetch user info:', error);
          // Continue with navigation even if user info fetch fails
        }
      }

      // Try multiple navigation methods to ensure we get to the dashboard

      // Method 1: Use React Router navigate with explicit path
      console.debug('Attempting navigation with React Router');
      navigate('/dashboard', { replace: true });

      // Method 2: Use direct navigation after a short delay with full URL
      setTimeout(() => {
        console.debug('Attempting direct navigation to dashboard');
        // Ensure we're using the correct origin without appending /api
        const origin = window.location.origin;
        const dashboardUrl = `${origin}/dashboard`;
        console.debug('Dashboard URL:', dashboardUrl);
        window.location.href = dashboardUrl;
      }, 500);
    } catch (error) {
      console.error('Demo login error:', error);
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

  console.debug('Rendering Home component:', { isAuthenticated, loading });

  // Test menu items for the dropdown
  const testMenuItems = [
    {
      key: ROUTES.ICON_TEST,
      label: 'Icon Test',
    },
    {
      key: ROUTES.MODAL_TEST,
      label: 'Physics Parameters Modal Test',
    },
    {
      key: ROUTES.SIMPLE_MODAL_TEST,
      label: 'Simple Modal Test',
    },
    {
      key: ROUTES.STANDALONE_TEST,
      label: 'Standalone Test',
    },
    {
      key: ROUTES.MODAL_ACCESSIBILITY_TEST,
      label: 'Modal Accessibility Test',
    },
    {
      key: '/test/modal-routes',
      label: 'Modal Routes Test',
    },
    {
      key: '/modal-examples',
      label: 'Modal Examples',
    },
  ];

  const testMenu = (
    <Menu items={testMenuItems} onClick={({ key }) => navigate(key)} />
  );

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading">
          <p>Loading...</p>
          <small>Please wait while we check your session.</small>
        </div>
      </div>
    );
  }

  // If authenticated, the useEffect will handle redirect
  if (isAuthenticated) {
    return (
      <div className="home-container">
        <div className="loading">
          <p>Redirecting to dashboard...</p>
          <small>Please wait while we redirect you.</small>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Welcome to Harmonic Universe</h1>
        <p>Experience the harmony of sound and physics in a unique way.</p>
        <div className="home-actions">
          <Button onClick={handleDemoLogin} variant="primary" ref={buttonRef}>
            Try Demo
          </Button>

          <Dropdown
            menu={{ items: testMenuItems, onClick: ({ key }) => navigate(key) }}
            trigger={['click']}
          >
            <Button variant="secondary" style={{ marginLeft: '10px' }}>
              <Space>
                Tests
                <DownOutlined />
              </Space>
            </Button>
          </Dropdown>
        </div>
      </div>
    </div>
  );
}

export default Home;
