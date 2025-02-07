import { User } from '@/types';
import axiosInstance from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  username: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/auth/register', credentials);
    return response.data;
  },

  validateToken: async (token: string): Promise<User> => {
    const response = await axiosInstance.get('/auth/validate', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await axiosInstance.post('/auth/logout');
  },

  updateProfile: async (updates: Partial<User>): Promise<User> => {
    const response = await axiosInstance.patch('/auth/profile', updates);
    return response.data;
  },

  changePassword: async (passwords: {
    oldPassword: string;
    newPassword: string;
  }): Promise<void> => {
    await axiosInstance.post('/auth/change-password', passwords);
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    await axiosInstance.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await axiosInstance.post('/auth/reset-password', { token, password });
  },
};
