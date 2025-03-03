import { DownOutlined } from '@ant-design/icons';
import { Dropdown, Menu, Space } from 'antd';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
      const response = await api.post('/api/auth/demo-login');
      console.debug('Demo login response:', response);

      if (response.access_token) {
        localStorage.setItem('accessToken', response.access_token);
      }
      if (response.refresh_token) {
        localStorage.setItem('refreshToken', response.refresh_token);
      }

      // Fetch user info after successful demo login
      try {
        const userResponse = await api.get(endpoints.auth.me);
        console.debug('User info response:', userResponse);
        dispatch(loginSuccess(userResponse));
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        throw error;
      }
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
          <Button onClick={handleDemoLogin} variant="primary">
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
