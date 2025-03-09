import { Dropdown, Menu, Space } from 'antd';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { DownOutlined } from '@ant-design/icons';
import { ROUTES } from '../../../constants/routes';
import {
  checkAuthState,
  loginFailure,
  loginStart,
  loginSuccess,
} from '../../../store/slices/authSlice';
import { api, endpoints } from '../../../utils/api';
import Button from '../../common/Button';
import { useModal } from '../../../contexts/ModalContext';
import { MODAL_TYPES } from '../../../utils/modalRegistry';
import { demoLogin } from '../../../store/thunks/authThunks';
import './Home.css';

function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading } = useSelector(state => state.auth);
  const buttonRef = useRef(null);
  const { openModal } = useModal();

  useEffect(() => {
    console.debug('Home component mounted');
    dispatch(checkAuthState());

    // Check for modal parameter in URL
    const searchParams = new URLSearchParams(location.search);
    const modalParam = searchParams.get('modal');

    if (modalParam === 'login') {
      handleLoginClick();
    } else if (modalParam === 'register') {
      handleRegisterClick();
    }
  }, [dispatch, location]);

  useEffect(() => {
    console.debug('Auth state updated:', { isAuthenticated, loading });
    if (isAuthenticated && !loading) {
      console.debug('Redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLoginClick = () => {
    console.debug('Opening login modal');
    navigate({ pathname: location.pathname, search: '?modal=login' }, { replace: true });
  };

  const handleRegisterClick = () => {
    console.debug('Opening register modal');
    navigate({ pathname: location.pathname, search: '?modal=register' }, { replace: true });
  };

  const handleDemoLogin = async () => {
    try {
      console.debug('Starting demo login');

      // Use the thunk action for demo login
      const resultAction = await dispatch(demoLogin());

      if (demoLogin.fulfilled.match(resultAction)) {
        console.debug('Demo login succeeded, navigating to dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        // The error handling is done in the thunk
        console.error('Demo login failed:', resultAction.payload);
      }
    } catch (error) {
      console.error('Unexpected error during demo login:', error);
      dispatch(loginFailure('An unexpected error occurred during demo login.'));
      openModal({
        title: 'Demo Login Error',
        content: 'An unexpected error occurred. Please try again.',
        type: 'alert',
      });
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
          <Button
            onClick={handleDemoLogin}
            variant="primary"
            ref={buttonRef}
          >
            Try Demo
          </Button>

          <Button
            onClick={handleLoginClick}
            variant="secondary"
            className="login-button"
            style={{ marginLeft: '10px' }}
          >
            Login
          </Button>

          <Button
            onClick={handleRegisterClick}
            variant="secondary"
            className="register-button"
            style={{ marginLeft: '10px' }}
          >
            Sign Up
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
