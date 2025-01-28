import axios from 'axios';
import api from './api';
import { ERROR_CATEGORIES, ERROR_SEVERITY, logError } from './errorLogging';

const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AuthService {
  constructor() {
    this.refreshPromise = null;
    this.tokenRefreshThreshold = 5 * 60 * 1000; // 5 minutes
    this.token = localStorage.getItem('token');
    this.user = JSON.parse(localStorage.getItem('user'));

    // Demo user credentials
    this.DEMO_USER = {
      email: 'demo@example.com',
      password: 'demo123',
    };
  }

  async register(userData) {
    const response = await api.auth.register(userData);
    this.setSession(response.token, response.user);
    return response.user;
  }

  async login(credentials) {
    const response = await api.auth.login(credentials);
    this.setSession(response.token, response.user);
    return response.user;
  }

  async logout() {
    try {
      await api.auth.logout();
    } finally {
      this.clearSession();
    }
  }

  async getCurrentUser() {
    if (!this.token) return null;
    try {
      const user = await api.auth.getCurrentUser();
      this.setUser(user);
      return user;
    } catch (error) {
      this.clearSession();
      throw error;
    }
  }

  async updateUser(userData) {
    const user = await api.auth.updateProfile(userData);
    this.setUser(user);
    return user;
  }

  async deleteAccount() {
    await api.auth.deleteAccount();
    this.clearSession();
  }

  async deactivateAccount() {
    const response = await api.auth.deactivateAccount();
    this.clearSession();
    return response;
  }

  async activateAccount() {
    const response = await api.auth.activateAccount();
    return response;
  }

  async updatePassword(oldPassword, newPassword) {
    const response = await api.auth.updateProfile({
      password: newPassword,
      old_password: oldPassword,
    });
    return response;
  }

  setSession(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  setUser(user) {
    this.user = user;
    localStorage.setItem('user', JSON.stringify(user));
  }

  clearSession() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isAuthenticated() {
    return !!this.token;
  }

  getUser() {
    return this.user;
  }

  getToken() {
    return this.token;
  }

  async updateProfile(data) {
    return axios.put(`${API_URL}/auth/profile`, data);
  }

  async changePassword(currentPassword, newPassword) {
    return axios.put(`${API_URL}/auth/password`, {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  async requestPasswordReset(email) {
    return axios.post(`${API_URL}/auth/password/reset`, { email });
  }

  async resetPassword(token, newPassword) {
    return axios.put(`${API_URL}/auth/password/reset`, {
      token,
      new_password: newPassword,
    });
  }

  async verifyEmail(token) {
    return axios.post(`${API_URL}/auth/verify-email`, { token });
  }

  async resendVerificationEmail() {
    return axios.post(`${API_URL}/auth/verify-email/resend`);
  }

  async refreshToken() {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await axios.post(
          `${API_URL}/auth/refresh-token`,
          null,
          {
            headers: {
              Authorization: `Bearer ${this.getToken()}`,
            },
          }
        );

        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          axios.defaults.headers.common['Authorization'] =
            `Bearer ${response.data.token}`;
        }

        return response.data;
      } catch (error) {
        const authError = this.categorizeAuthError(error);
        logError(
          error,
          'Token Refresh',
          ERROR_CATEGORIES.AUTHENTICATION,
          authError.severity
        );
        throw authError;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  handleAuthSuccess(data) {
    if (data.token) {
      localStorage.setItem('token', data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    }
  }

  categorizeAuthError(error) {
    const baseError = {
      message: 'An unexpected error occurred',
      type: AUTH_ERRORS.SERVER_ERROR,
      severity: ERROR_SEVERITY.HIGH,
      details: [],
    };

    if (!error.response) {
      return {
        ...baseError,
        type: AUTH_ERRORS.NETWORK_ERROR,
        message: 'Network error occurred',
        severity: ERROR_SEVERITY.MEDIUM,
      };
    }

    switch (error.response.status) {
      case 401:
        return {
          ...baseError,
          type: AUTH_ERRORS.INVALID_CREDENTIALS,
          message: 'Invalid credentials',
          severity: ERROR_SEVERITY.LOW,
        };
      case 403:
        return {
          ...baseError,
          type: AUTH_ERRORS.TOKEN_EXPIRED,
          message: 'Session expired',
          severity: ERROR_SEVERITY.MEDIUM,
        };
      case 422:
        return {
          ...baseError,
          type: AUTH_ERRORS.VALIDATION_ERROR,
          message: 'Validation error',
          severity: ERROR_SEVERITY.LOW,
          details: error.response.data.errors || [],
        };
      default:
        return baseError;
    }
  }

  getErrorDetails(authError) {
    if (authError.details && authError.details.length > 0) {
      return authError.details.join(', ');
    }
    return 'Please try again or contact support if the issue persists.';
  }

  setupAxiosInterceptors() {
    const token = this.getToken();
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          this.logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }
}

export default new AuthService();
authService.setupAxiosInterceptors();
