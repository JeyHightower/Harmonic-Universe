import { useNotification } from '@/components/common/Notification';
import api from '@/services/api';
import { demoLogin, login, logoutUser, refreshToken as refreshTokenThunk, setUser } from '@/store/slices/authSlice';
import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  const refreshTimeoutRef = useRef(null);

  const {
    isAuthenticated,
    token,
    user,
    loading,
    error
  } = useSelector(state => state.auth);

  const clearAuthState = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    dispatch(logoutUser());
  }, [dispatch]);

  const handleAuthFailed = useCallback((event) => {
    const error = event.detail?.error || 'Authentication failed';
    showNotification(error, 'error');
    clearAuthState();
    navigate('/login', { state: { from: location } });
  }, [clearAuthState, navigate, location, showNotification]);

  const setupTokenRefresh = useCallback((token) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    try {
      // Decode token to get expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresIn = payload.exp * 1000 - Date.now(); // Convert to milliseconds

      // Refresh 5 minutes before expiration
      const refreshTime = Math.max(0, expiresIn - 5 * 60 * 1000);

      refreshTimeoutRef.current = setTimeout(async () => {
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await api.post('/api/auth/refresh', {
            refresh_token: refreshToken,
            access_token: token
          });

          const { access_token, refresh_token } = response.data;

          localStorage.setItem('token', access_token);
          localStorage.setItem('refreshToken', refresh_token);
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

          dispatch(refreshTokenThunk({ token: access_token }));
          setupTokenRefresh(access_token);
        } catch (error) {
          console.error('Token refresh failed:', error);
          handleAuthFailed({ detail: { error: 'Session expired. Please log in again.' } });
        }
      }, refreshTime);
    } catch (error) {
      console.error('Error setting up token refresh:', error);
      handleAuthFailed({ detail: { error: 'Invalid token. Please log in again.' } });
    }
  }, [dispatch, handleAuthFailed]);

  const handleLogin = useCallback(async (credentials) => {
    try {
      const response = await dispatch(login(credentials)).unwrap();
      const { access_token, refresh_token, user } = response;

      localStorage.setItem('token', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));

      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setupTokenRefresh(access_token);

      // Navigate to the page they tried to visit or default to dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });

      return true;
    } catch (error) {
      showNotification(error.message || 'Login failed', 'error');
      return false;
    }
  }, [dispatch, navigate, location, setupTokenRefresh, showNotification]);

  const handleLogout = useCallback(async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      clearAuthState();
      navigate('/login');
    }
  }, [dispatch, navigate, clearAuthState]);

  const handleDemoLogin = useCallback(async () => {
    try {
      const response = await dispatch(demoLogin()).unwrap();
      const { access_token, refresh_token, user } = response;

      localStorage.setItem('token', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));

      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setupTokenRefresh(access_token);

      navigate('/dashboard');

      return true;
    } catch (error) {
      showNotification('Demo login failed', 'error');
      return false;
    }
  }, [dispatch, navigate, setupTokenRefresh, showNotification]);

  useEffect(() => {
    // Listen for authentication failures
    window.addEventListener('auth:failed', handleAuthFailed);

    // Initialize auth state from localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        dispatch(setUser({ user, token: storedToken }));
        setupTokenRefresh(storedToken);
      } catch (error) {
        console.error('Error restoring auth state:', error);
        clearAuthState();
      }
    }

    return () => {
      window.removeEventListener('auth:failed', handleAuthFailed);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [dispatch, setupTokenRefresh, handleAuthFailed, clearAuthState]);

  return {
    isAuthenticated,
    token,
    user,
    loading,
    error,
    login: handleLogin,
    logout: handleLogout,
    demoLogin: handleDemoLogin
  };
};
