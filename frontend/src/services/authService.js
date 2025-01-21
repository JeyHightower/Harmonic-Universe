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
  }

  async login(credentials) {
    try {
      const response = await axios.post('/api/auth/login', credentials);
      this.handleAuthSuccess(response.data);

      // Show success notification
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

  async register(userData) {
    try {
      const response = await axios.post('/api/auth/register', userData);
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
      await axios.post('/api/auth/logout');
      this.clearAuthData();

      // Show success notification
      const event = new CustomEvent('show-success', {
        detail: {
          message: 'Logged Out Successfully',
          details: 'See you next time!',
          category: 'AUTH_LOGOUT',
          duration: 3000,
        },
      });
      window.dispatchEvent(event);
    } catch (error) {
      logError(
        error,
        'Logout',
        ERROR_CATEGORIES.AUTHENTICATION,
        ERROR_SEVERITY.WARNING
      );

      // Show warning notification
      const event = new CustomEvent('show-warning', {
        detail: {
          message: 'Logout Error',
          details:
            'There was a problem logging out. Your session may still be active.',
          category: 'AUTH_LOGOUT_ERROR',
          duration: 5000,
        },
      });
      window.dispatchEvent(event);
    }
  }

  async refreshToken() {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await axios.post('/api/auth/refresh');
        this.handleAuthSuccess(response.data);
        return response.data;
      } catch (error) {
        const authError = this.categorizeAuthError(error);
        if (authError.type === AUTH_ERRORS.TOKEN_EXPIRED) {
          this.clearAuthData();

          // Show warning notification
          const event = new CustomEvent('show-warning', {
            detail: {
              message: 'Session Expired',
              details: 'Please log in again to continue.',
              category: 'AUTH_SESSION_EXPIRED',
              duration: 5000,
            },
          });
          window.dispatchEvent(event);
        }
        throw authError;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  categorizeAuthError(error) {
    const baseError = {
      message: 'Authentication failed',
      type: AUTH_ERRORS.SERVER_ERROR,
      severity: ERROR_SEVERITY.ERROR,
      originalError: error,
    };

    if (!error.response) {
      return {
        ...baseError,
        type: AUTH_ERRORS.NETWORK_ERROR,
        message: 'Network error occurred during authentication',
      };
    }

    switch (error.response.status) {
      case 400:
        return {
          ...baseError,
          type: AUTH_ERRORS.VALIDATION_ERROR,
          message: 'Invalid input data',
          severity: ERROR_SEVERITY.WARNING,
        };
      case 401:
        return {
          ...baseError,
          type: AUTH_ERRORS.INVALID_CREDENTIALS,
          message: 'Invalid credentials',
        };
      case 403:
        return {
          ...baseError,
          type: AUTH_ERRORS.TOKEN_EXPIRED,
          message: 'Authentication token expired',
        };
      default:
        return baseError;
    }
  }

  getErrorDetails(authError) {
    switch (authError.type) {
      case AUTH_ERRORS.INVALID_CREDENTIALS:
        return 'Please check your username and password and try again.';
      case AUTH_ERRORS.TOKEN_EXPIRED:
        return 'Your session has expired. Please log in again.';
      case AUTH_ERRORS.NETWORK_ERROR:
        return 'Please check your internet connection and try again.';
      case AUTH_ERRORS.VALIDATION_ERROR:
        return (
          authError.originalError.response?.data?.message ||
          'Please check your input and try again.'
        );
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }

  handleAuthSuccess(data) {
    localStorage.setItem('token', data.token);
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    this.setupTokenRefresh(data.token);
  }

  setupTokenRefresh(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresIn = payload.exp * 1000 - Date.now();

      if (expiresIn > this.tokenRefreshThreshold) {
        setTimeout(
          () => this.refreshToken(),
          expiresIn - this.tokenRefreshThreshold
        );
      } else {
        this.refreshToken();
      }
    } catch (error) {
      logError(
        error,
        'Token Refresh Setup',
        ERROR_CATEGORIES.AUTHENTICATION,
        ERROR_SEVERITY.WARNING
      );

      // Show warning notification
      const event = new CustomEvent('show-warning', {
        detail: {
          message: 'Token Refresh Error',
          details:
            'There was a problem setting up automatic token refresh. You may need to log in again soon.',
          category: 'AUTH_TOKEN_REFRESH',
          duration: 5000,
        },
      });
      window.dispatchEvent(event);
    }
  }

  clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? `Bearer ${token}` : '';
  }

  isAuthenticated() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
}

const authService = new AuthService();
export default authService;
