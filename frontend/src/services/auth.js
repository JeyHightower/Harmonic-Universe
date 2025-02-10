import api from './api';

export const authService = {
  // Login user
  login: async data => {
    const response = await api.post('/api/auth/login', data);
    const { user, access_token, refresh_token } = response.data;

    // Store tokens and user data
    localStorage.setItem('token', access_token);
    localStorage.setItem('refreshToken', refresh_token);
    localStorage.setItem('user', JSON.stringify(user));

    return response.data;
  },

  // Demo login
  demoLogin: async () => {
    try {
      const demoCredentials = {
        email: 'demo@example.com',
        password: 'password',
      };

      const response = await api.post('/api/auth/login', demoCredentials);
      const { user, access_token, refresh_token } = response.data;

      // Store tokens and user data
      localStorage.setItem('token', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));

      // Return all necessary data
      return {
        user,
        access_token,
        refresh_token,
      };
    } catch (error) {
      console.error('Demo login error:', error);
      throw new Error(error.response?.data?.message || 'Demo login failed');
    }
  },

  // Register user
  register: async data => {
    const response = await api.post('/api/auth/register', data);
    const { user, access_token, refresh_token } = response.data;

    // Store tokens and user data
    localStorage.setItem('token', access_token);
    localStorage.setItem('refreshToken', refresh_token);
    localStorage.setItem('user', JSON.stringify(user));

    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  // Update user profile
  updateProfile: async data => {
    const response = await api.put('/api/auth/me', data);

    // Update stored user data
    localStorage.setItem('user', JSON.stringify(response.data));

    return response.data;
  },

  // Change password
  changePassword: async data => {
    await api.put('/api/auth/password', data);
  },

  // Request password reset
  requestPasswordReset: async email => {
    await api.post('/api/auth/password-reset/request', { email });
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    await api.post('/api/auth/password-reset/reset', { token, newPassword });
  },

  // Verify email
  verifyEmail: async token => {
    await api.post('/api/auth/verify-email', { token });
  },

  // Refresh access token
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post('/api/auth/refresh', {
      refresh_token: refreshToken,
    });

    const { access_token } = response.data;
    localStorage.setItem('token', access_token);

    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      // Get current token
      const token = localStorage.getItem('token');

      // Clear storage first to prevent any race conditions
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // Attempt to call logout endpoint if we have a token
      if (token) {
        await api.post(
          '/api/auth/logout',
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      // Clear any other application state if needed
      sessionStorage.clear(); // Clear any session storage

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Still consider it a success since we've cleared local storage
      return { success: true };
    }
  },
};
