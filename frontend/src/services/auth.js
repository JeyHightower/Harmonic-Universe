import api from './api';

export const authService = {
  // Login user
  login: async data => {
    try {
      const response = await api.post('/api/auth/login', data);
      const { user, access_token, refresh_token } = response.data;

      // Store tokens and user data
      localStorage.setItem('token', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));

      // Update axios default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      // Clear any stale data
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      throw error;
    }
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

      // Update axios default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      return response.data;
    } catch (error) {
      console.error('Demo login error:', error);
      // Clear any stale data
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      throw error;
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
    try {
      const response = await api.get('/api/auth/me');
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
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

  // Logout user
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      // Clear storage first to prevent any race conditions
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];

      // Attempt to call logout endpoint if we have a token
      if (refreshToken) {
        await api.post('/api/auth/logout', { refresh_token: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local storage and headers even if the API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      throw error;
    }
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/api/auth/refresh', {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token } = response.data;

      // Update stored tokens
      localStorage.setItem('token', access_token);
      if (refresh_token) {
        localStorage.setItem('refreshToken', refresh_token);
      }

      // Update axios default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear auth data on refresh failure
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      throw error;
    }
  },
};
