import api from './api';

export const authService = {
  async login(credentials) {
    try {
      const response = await api.post('/api/auth/login', credentials);
      if (response.data.status === 'success') {
        const { token, user } = response.data.data;
        localStorage.setItem('token', token);
        return { user, token };
      }
      throw new Error(response.data.message || 'Login failed');
    } catch (error) {
      localStorage.removeItem('token');
      throw error.response?.data || error;
    }
  },

  async register(userData) {
    try {
      const response = await api.post('/api/auth/register', userData);
      if (response.data.status === 'success') {
        const { token, user } = response.data.data;
        localStorage.setItem('token', token);
        return { user, token };
      }
      throw new Error(response.data.message || 'Registration failed');
    } catch (error) {
      localStorage.removeItem('token');
      throw error.response?.data || error;
    }
  },

  async logout() {
    try {
      await api.post('/api/auth/logout');
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('token');
    }
  },

  async getCurrentUser() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await api.get('/api/auth/me');
      if (response.data.status === 'success') {
        return response.data.data.user;
      }
      throw new Error('Failed to get current user');
    } catch (error) {
      localStorage.removeItem('token');
      throw error.response?.data || error;
    }
  },
};

export default authService;
