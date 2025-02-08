import { useCallback, useEffect, useState } from 'react';
import { authService } from '../services/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load user from local storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          // Attempt to refresh token on mount
          await handleRefreshToken();
        }
      } catch (err) {
        console.error('Error loading user:', err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

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

  const handleLogin = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login({ email, password });
      setUser(response.user);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDemoLogin = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.demoLogin();
      setUser(response.user);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Demo login failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

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
      authService.logout();
      setUser(null);
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const handleRefreshToken = useCallback(async () => {
    // Prevent multiple simultaneous refresh attempts
    if (refreshing) return false;

    try {
      setRefreshing(true);
      await authService.refreshToken();
      return true;
    } catch (err) {
      console.error('Token refresh failed:', err);
      // If refresh fails, log out the user
      handleLogout();
      return false;
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, handleLogout]);

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
