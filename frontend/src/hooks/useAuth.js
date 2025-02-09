import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  // Load user from local storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
          // Attempt to refresh token on mount
          await handleRefreshToken();
          // Verify the token is still valid
          await authService.getCurrentUser();
          // If user is on login page, redirect to dashboard
          if (window.location.pathname === '/login') {
            navigate('/dashboard');
          }
        }
      } catch (err) {
        console.error('Error loading user:', err);
        // If there's an error, clear the stored data
        handleLogout();
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [navigate]);

  // Set up token refresh interval
  useEffect(() => {
    let refreshInterval;

    if (user) {
      // Refresh token every 25 minutes (5 minutes before expiry)
      refreshInterval = setInterval(handleRefreshToken, 25 * 60 * 1000);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [user]);

  const handleRefreshToken = async () => {
    try {
      setRefreshing(true);
      await authService.refreshToken();
    } catch (err) {
      console.error('Error refreshing token:', err);
      handleLogout();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogin = useCallback(
    async (email, password) => {
      try {
        setLoading(true);
        setError(null);
        const response = await authService.login({ email, password });
        setUser(response.user);
        navigate('/dashboard', { replace: true });
        return true;
      } catch (err) {
        setError(err.message || 'Login failed');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  const handleDemoLogin = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.demoLogin();

      // Set user and tokens in a single batch
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('refreshToken', response.refresh_token);
      setUser(response.user);

      // Ensure auth state is set before navigation
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 0);

      return true;
    } catch (err) {
      setError(err.message || 'Demo login failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleRegister = useCallback(async (username, email, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.register({ username, email, password });
      setUser(response.user);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      setLoading(true);
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setError(null);
      setLoading(false);
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleUpdateProfile = useCallback(async data => {
    try {
      setLoading(true);
      setError(null);
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Profile update failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    loading,
    error,
    refreshing,
    isAuthenticated: !!user,
    login: handleLogin,
    demoLogin: handleDemoLogin,
    register: handleRegister,
    logout: handleLogout,
    updateProfile: handleUpdateProfile,
    refreshToken: handleRefreshToken,
    clearError,
  };
};
