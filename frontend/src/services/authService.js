import axiosInstance from './api';

export const authService = {
  login: async (credentials) => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },

  register: async (credentials) => {
    const response = await axiosInstance.post('/auth/register', credentials);
    return response.data;
  },

  validateToken: async (token) => {
    const response = await axiosInstance.get('/auth/validate', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  logout: async () => {
    await axiosInstance.post('/auth/logout');
  },

  updateProfile: async (updates) => {
    const response = await axiosInstance.patch('/auth/profile', updates);
    return response.data;
  },

  changePassword: async (passwords) => {
    await axiosInstance.post('/auth/change-password', passwords);
  },

  requestPasswordReset: async (email) => {
    await axiosInstance.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token, password) => {
    await axiosInstance.post('/auth/reset-password', { token, password });
  },
};
