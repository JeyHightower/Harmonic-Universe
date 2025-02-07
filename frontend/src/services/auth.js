import api from './api';

export const authService = {
  // Login user
  login: async (data) => {
    const response = await api.post('/api/v1/auth/login', data);
    return response.data;
  },

  // Register user
  register: async (data) => {
    const response = await api.post('/api/v1/auth/register', data);
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/api/v1/auth/me');
    return response.data;
  },

  // Update user profile
  updateProfile: async (data) => {
    const response = await api.put('/api/v1/auth/profile', data);
    return response.data;
  },

  // Change password
  changePassword: async (data) => {
    await api.put('/api/v1/auth/password', data);
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    await api.post('/api/v1/auth/password-reset/request', { email });
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    await api.post('/api/v1/auth/password-reset/reset', { token, newPassword });
  },

  // Verify email
  verifyEmail: async (token) => {
    await api.post('/api/v1/auth/verify-email', { token });
  },

  // Resend verification email
  resendVerificationEmail: async () => {
    await api.post('/api/v1/auth/verify-email/resend');
  },
};
