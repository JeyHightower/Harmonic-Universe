import axios from 'axios';
import { ERROR_CATEGORIES, ERROR_SEVERITY, logError } from './errorLogging';

const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
};

class AuthService {
  constructor() {
    this.refreshPromise = null;
    this.tokenRefreshThreshold = 5 * 60 * 1000; // 5 minutes
    this.API_URL = '/api/auth';

    // Demo user credentials
    this.DEMO_USER = {
      email: 'demo@example.com',
      password: 'demo123',
    };
  }

  async login(credentials) {
    try {
      // Check if this is a demo user login
      if (
        credentials.email === this.DEMO_USER.email &&
        credentials.password === this.DEMO_USER.password
      ) {
        // Return mock data for demo user
        const demoResponse = {
          user: {
            id: 'demo-1',
            email: this.DEMO_USER.email,
            username: 'Demo User',
            isDemo: true,
          },
          token: 'demo-token-' + Date.now(),
        };

        this.handleAuthSuccess(demoResponse);

        const event = new CustomEvent('show-success', {
          detail: {
            message: 'Demo Login Successful',
            details: 'Welcome to the demo! Feel free to explore.',
            category: 'AUTH_DEMO_LOGIN',
            duration: 5000,
          },
        });
        window.dispatchEvent(event);

        return demoResponse;
      }

      // Regular login flow
      const response = await axios.post(`${this.API_URL}/login`, credentials);
      this.handleAuthSuccess(response.data);

      const event = new CustomEvent('show-success', {
        detail: {
          message: 'Login Successful',
          details: 'Welcome back!',
          category: 'AUTH_LOGIN',
          duration: 3000,
        },
      });
      window.dispatchEvent(event);

      return response.data;
    } catch (error) {
      const authError = this.categorizeAuthError(error);
      logError(
        error,
        'Login',
        ERROR_CATEGORIES.AUTHENTICATION,
        authError.severity
      );

      const event = new CustomEvent('show-error', {
        detail: {
          message: authError.message,
          details: this.getErrorDetails(authError),
          category: `AUTH_${authError.type}`,
          duration: 5000,
        },
      });
      window.dispatchEvent(event);

      throw authError;
    }
  }

  async register(userData) {
    try {
      const response = await axios.post(`${this.API_URL}/register`, userData);
      this.handleAuthSuccess(response.data);

      // Show success notification
      const event = new CustomEvent('show-success', {
        detail: {
          message: 'Registration Successful',
          details: 'Welcome to Harmonic Universe!',
          category: 'AUTH_REGISTER',
          duration: 4000,
        },
      });
      window.dispatchEvent(event);

      return response.data;
    } catch (error) {
      const authError = this.categorizeAuthError(error);
      logError(
        error,
        'Registration',
        ERROR_CATEGORIES.AUTHENTICATION,
        authError.severity
      );

      // Show error notification
      const event = new CustomEvent('show-error', {
        detail: {
          message: authError.message,
          details: this.getErrorDetails(authError),
          category: `AUTH_${authError.type}`,
          duration: 5000,
        },
      });
      window.dispatchEvent(event);

      throw authError;
    }
  }

  async logout() {
    try {
      await axios.post(`${this.API_URL}/logout`, null, {
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      });
      localStorage.removeItem('token');
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      return false;
    }
  }

  getToken() {
    return localStorage.getItem('token');
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  async resetPassword(email) {
    try {
      const response = await axios.post(`${this.API_URL}/reset-password`, {
        email,
      });
      return response.data;
    } catch (error) {
      const authError = this.categorizeAuthError(error);
      logError(
        error,
        'Password Reset',
        ERROR_CATEGORIES.AUTHENTICATION,
        authError.severity
      );
      throw authError;
    }
  }

  async confirmResetPassword(token, newPassword) {
    try {
      const response = await axios.post(
        `${this.API_URL}/reset-password/confirm`,
        {
          token,
          newPassword,
        }
      );
      return response.data;
    } catch (error) {
      const authError = this.categorizeAuthError(error);
      logError(
        error,
        'Password Reset Confirmation',
        ERROR_CATEGORIES.AUTHENTICATION,
        authError.severity
      );
      throw authError;
    }
  }

  async refreshToken() {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await axios.post(
          `${this.API_URL}/refresh-token`,
          null,
          {
            headers: {
              Authorization: `Bearer ${this.getToken()}`,
            },
          }
        );

        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
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
}

export const authService = new AuthService();
