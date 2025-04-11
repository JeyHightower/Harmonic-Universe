/**
 * Auth API Service
 * Handles authentication operations like login, register, logout, and token management
 */

import axios from 'axios';
import { log } from '../../utils';
import { httpService } from './httpService';
import { baseApi } from './baseApi';
import { utilityApi } from './utilityApi';
import { endpoints } from '../endpoints';

/**
 * Auth API service for authentication operations
 */
export const authApi = {
  /**
   * Login with username and password
   * @param {string} username - Username
   * @param {string} password - Password
   * @param {object} options - Additional options
   * @returns {Promise<object>} - Login response with token
   */
  login: async (username, password, options = {}) => {
    try {
      if (!username || !password) {
        return {
          success: false,
          message: 'Username and password are required'
        };
      }

      const endpoint = utilityApi.getEndpoint('auth', 'login');
      if (!endpoint) {
        return {
          success: false,
          message: 'Login endpoint not available'
        };
      }

      const response = await baseApi.post(endpoint, { 
        username, 
        password,
        remember: options.remember || false 
      });

      if (response.data?.token) {
        // Store token in localStorage if successful
        localStorage.setItem('auth_token', response.data.token);
        
        // Store username for convenience
        localStorage.setItem('username', username);
        
        return {
          success: true,
          message: 'Login successful',
          data: response.data
        };
      }

      return {
        success: false,
        message: response.message || 'Login failed',
        data: response.data
      };
    } catch (error) {
      log('api', 'Login error', { error: error.message });
      
      return {
        success: false,
        message: error.message || 'Login failed',
        error
      };
    }
  },

  /**
   * Demo login - uses a demo account for testing
   * @returns {Promise<object>} - Login response with token
   */
  demoLogin: async () => {
    try {
      const endpoint = utilityApi.getEndpoint('auth', 'demoLogin');
      if (!endpoint) {
        return {
          success: false,
          message: 'Demo login endpoint not available'
        };
      }

      const response = await baseApi.post(endpoint, {}, {
        skipAuth: true,
        cache: false
      });

      if (response.data?.token) {
        // Store token in localStorage if successful
        localStorage.setItem('auth_token', response.data.token);
        
        // Store demo username
        localStorage.setItem('username', 'demo');
        localStorage.setItem('is_demo', 'true');
        
        return {
          success: true,
          message: 'Demo login successful',
          data: response.data
        };
      }

      return {
        success: false,
        message: response.message || 'Demo login failed',
        data: response.data
      };
    } catch (error) {
      log('api', 'Demo login error', { error: error.message });
      
      return {
        success: false,
        message: error.message || 'Demo login failed',
        error
      };
    }
  },

  /**
   * Register a new user
   * @param {object} userData - User registration data
   * @returns {Promise<object>} - Registration response
   */
  register: async (userData) => {
    try {
      if (!userData.username || !userData.password || !userData.email) {
        return {
          success: false,
          message: 'Username, password, and email are required'
        };
      }

      const endpoint = utilityApi.getEndpoint('auth', 'register');
      if (!endpoint) {
        return {
          success: false,
          message: 'Register endpoint not available'
        };
      }

      const response = await baseApi.post(endpoint, userData, {
        skipAuth: true,
        cache: false
      });

      if (response.success) {
        // Automatically log in the user after registration if token is provided
        if (response.data?.token) {
          localStorage.setItem('auth_token', response.data.token);
          localStorage.setItem('username', userData.username);
        }

        return {
          success: true,
          message: 'Registration successful',
          data: response.data
        };
      }

      return {
        success: false,
        message: response.message || 'Registration failed',
        data: response.data
      };
    } catch (error) {
      log('api', 'Registration error', { error: error.message });
      
      return {
        success: false,
        message: error.message || 'Registration failed',
        error
      };
    }
  },

  /**
   * Log out the current user
   * @returns {Promise<object>} - Logout response
   */
  logout: async () => {
    try {
      const endpoint = utilityApi.getEndpoint('auth', 'logout');
      
      // Always clear local storage tokens, even if API call fails
      localStorage.removeItem('auth_token');
      localStorage.removeItem('username');
      localStorage.removeItem('is_demo');

      // If no endpoint, just return success since we've cleared local tokens
      if (!endpoint) {
        return {
          success: true,
          message: 'Logged out (client-side only)'
        };
      }

      // Attempt to call the logout endpoint
      const response = await baseApi.post(endpoint, {}, {
        // Skip caching for logout requests
        cache: false,
        // Continue even if no token is present
        skipTokenCheck: true
      });

      return {
        success: true,
        message: 'Logged out successfully',
        data: response.data
      };
    } catch (error) {
      log('api', 'Logout error', { error: error.message });
      
      // Even if the API call fails, consider logout successful if we've cleared tokens
      return {
        success: true,
        message: 'Logged out (client-side only)',
        error: error.message
      };
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} - True if user is authenticated
   */
  isAuthenticated: () => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      return false;
    }
    
    // Check if token is expired
    return !utilityApi.isTokenExpired(token);
  },

  /**
   * Get the current auth token
   * @returns {string|null} - The auth token or null if not authenticated
   */
  getToken: () => {
    return localStorage.getItem('auth_token');
  },

  /**
   * Refresh the auth token
   * @returns {Promise<object>} - Refresh response with new token
   */
  refreshToken: async () => {
    try {
      const endpoint = utilityApi.getEndpoint('auth', 'refreshToken');
      if (!endpoint) {
        return {
          success: false,
          message: 'Refresh token endpoint not available'
        };
      }

      const response = await baseApi.post(endpoint, {}, {
        // Skip auth checks that would create an infinite loop
        skipTokenCheck: true,
        cache: false
      });

      if (response.data?.token) {
        // Update token in localStorage
        localStorage.setItem('auth_token', response.data.token);
        
        return {
          success: true,
          message: 'Token refreshed successfully',
          data: response.data
        };
      }

      return {
        success: false,
        message: response.message || 'Failed to refresh token',
        data: response.data
      };
    } catch (error) {
      log('api', 'Refresh token error', { error: error.message });
      
      return {
        success: false,
        message: error.message || 'Failed to refresh token',
        error
      };
    }
  },

  /**
   * Request password reset
   * @param {string} email - Email address
   * @returns {Promise<object>} - Password reset request response
   */
  requestPasswordReset: async (email) => {
    try {
      if (!email) {
        return {
          success: false,
          message: 'Email is required'
        };
      }

      const endpoint = utilityApi.getEndpoint('auth', 'requestPasswordReset');
      if (!endpoint) {
        return {
          success: false,
          message: 'Password reset endpoint not available'
        };
      }

      const response = await baseApi.post(endpoint, { email }, {
        skipAuth: true,
        cache: false
      });

      return {
        success: true,
        message: 'Password reset request sent',
        data: response.data
      };
    } catch (error) {
      log('api', 'Password reset request error', { error: error.message });
      
      return {
        success: false,
        message: error.message || 'Failed to request password reset',
        error
      };
    }
  },

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise<object>} - Password reset response
   */
  resetPassword: async (token, password) => {
    try {
      if (!token || !password) {
        return {
          success: false,
          message: 'Token and password are required'
        };
      }

      const endpoint = utilityApi.getEndpoint('auth', 'resetPassword');
      if (!endpoint) {
        return {
          success: false,
          message: 'Password reset endpoint not available'
        };
      }

      const response = await baseApi.post(endpoint, { token, password }, {
        skipAuth: true,
        cache: false
      });

      return {
        success: true,
        message: 'Password reset successful',
        data: response.data
      };
    } catch (error) {
      log('api', 'Password reset error', { error: error.message });
      
      return {
        success: false,
        message: error.message || 'Failed to reset password',
        error
      };
    }
  },

  /**
   * Change password for authenticated user
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<object>} - Password change response
   */
  changePassword: async (currentPassword, newPassword) => {
    try {
      if (!currentPassword || !newPassword) {
        return {
          success: false,
          message: 'Current and new passwords are required'
        };
      }

      const endpoint = utilityApi.getEndpoint('auth', 'changePassword');
      if (!endpoint) {
        return {
          success: false,
          message: 'Change password endpoint not available'
        };
      }

      const response = await baseApi.post(endpoint, { 
        currentPassword, 
        newPassword 
      }, {
        cache: false
      });

      return {
        success: true,
        message: 'Password changed successfully',
        data: response.data
      };
    } catch (error) {
      log('api', 'Password change error', { error: error.message });
      
      return {
        success: false,
        message: error.message || 'Failed to change password',
        error
      };
    }
  },

  /**
   * Verify email address
   * @param {string} token - Verification token
   * @returns {Promise<object>} - Verification response
   */
  verifyEmail: async (token) => {
    try {
      if (!token) {
        return {
          success: false,
          message: 'Verification token is required'
        };
      }

      const endpoint = utilityApi.getEndpoint('auth', 'verifyEmail');
      if (!endpoint) {
        return {
          success: false,
          message: 'Email verification endpoint not available'
        };
      }

      const response = await baseApi.post(endpoint, { token }, {
        skipAuth: true,
        cache: false
      });

      return {
        success: true,
        message: 'Email verified successfully',
        data: response.data
      };
    } catch (error) {
      log('api', 'Email verification error', { error: error.message });
      
      return {
        success: false,
        message: error.message || 'Failed to verify email',
        error
      };
    }
  }
};

// Export the authApi module
export default authApi; 