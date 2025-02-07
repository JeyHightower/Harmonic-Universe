import { LoginFormData, RegisterFormData, User } from '@/types/user';
import api from './api';

export const authService = {
  // Login user
  login: async (data: LoginFormData): Promise<{ token: string; user: User }> => {
    const response = await api.post('/api/v1/auth/login', data);
    return response.data;
  },

  // Register user
  register: async (data: RegisterFormData): Promise<{ token: string; user: User }> => {
    const response = await api.post('/api/v1/auth/register', data);
    return response.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/api/v1/auth/me');
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put('/api/v1/auth/profile', data);
    return response.data;
  },

  // Change password
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    await api.put('/api/v1/auth/password', data);
  },

  // Request password reset
  requestPasswordReset: async (email: string): Promise<void> => {
    await api.post('/api/v1/auth/password-reset/request', { email });
  },

  // Reset password
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post('/api/v1/auth/password-reset/reset', { token, newPassword });
  },

  // Verify email
  verifyEmail: async (token: string): Promise<void> => {
    await api.post('/api/v1/auth/verify-email', { token });
  },

  // Resend verification email
  resendVerificationEmail: async (): Promise<void> => {
    await api.post('/api/v1/auth/verify-email/resend');
  },
};
