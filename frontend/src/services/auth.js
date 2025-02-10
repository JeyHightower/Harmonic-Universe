import api from './api';

export const authService = {
  // Login user
  login: async data => {
    try {
      // Clear existing auth state
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];

      const response = await api.post('/api/auth/login', data);
      const { user, access_token, refresh_token } = response.data;

      // Store tokens and user data
      localStorage.setItem('token', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));

      // Update axios default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      return { user, access_token, refresh_token };
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Demo login
  demoLogin: async () => {
    try {
      // Clear existing auth state
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];

      const response = await api.post('/api/auth/demo-login');
      const { user, access_token, refresh_token } = response.data;

      // Store tokens and user data
      localStorage.setItem('token', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));

      // Update axios default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      return { user, access_token, refresh_token };
    } catch (error) {
      console.error('Demo login error:', error.response?.data || error.message);
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
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No access token available');
      }

      // Ensure authorization header is set
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const response = await api.get('/api/auth/me');
      const userData = response.data;

      // Update stored user data
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Get current user error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        // Try to refresh token on 401
        try {
          await authService.refreshToken();
          // Retry the request after refresh
          const response = await api.get('/api/auth/me');
          const userData = response.data;
          localStorage.setItem('user', JSON.stringify(userData));
          return userData;
        } catch (refreshError) {
          // If refresh fails, clear auth state
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          delete api.defaults.headers.common['Authorization'];
          throw refreshError;
        }
      }
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
      const currentToken = localStorage.getItem('token');

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Include both tokens in refresh request
      const response = await api.post('/api/auth/refresh', {
        refresh_token: refreshToken,
        access_token: currentToken // Include current access token
      });

      const { access_token, refresh_token } = response.data;

      if (!access_token) {
        throw new Error('No access token received from server');
      }

      // Update stored tokens
      localStorage.setItem('token', access_token);
      if (refresh_token) {
        localStorage.setItem('refreshToken', refresh_token);
      }

      // Update axios default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      return { access_token, refresh_token: refresh_token || refreshToken };
    } catch (error) {
      console.error('Token refresh error:', error.response?.data || error.message);

      // Only clear auth data if it's not a network error and server explicitly rejects
      if (error.response && error.response.status !== 0) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
      }

      throw error;
    }
  },
};

export default authService;
