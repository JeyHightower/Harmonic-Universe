/**
 * Auth Service
 * Handles authentication operations like login, register, token validation
 */

import { AUTH_CONFIG } from '../utils/config';
import { API_SERVICE_CONFIG } from './config.mjs';
import { demoService } from './demo.service.mjs';
import { authEndpoints } from './endpoints.mjs';
import { httpClient } from './http-client.mjs';

// Constants for token storage
const TOKEN_KEY = API_SERVICE_CONFIG.AUTH.TOKEN_KEY;
const REFRESH_TOKEN_KEY = API_SERVICE_CONFIG.AUTH.REFRESH_TOKEN_KEY;
const USER_KEY = API_SERVICE_CONFIG.AUTH.USER_KEY;
const TOKEN_VERIFICATION_FAILED = 'token_verification_failed';

// Token validation cache
const tokenValidationCache = {
  lastValidation: null,
  isValid: false,
  validationPromise: null,
  cooldown: 5000, // 5 seconds cooldown between validations
};

class AuthService {
  constructor() {
    this.httpClient = httpClient;
    this.token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    this.refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    this.user = this.getUserFromStorage();
  }

  getUserFromStorage() {
    try {
      const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user from storage:', error);
      return null;
    }
  }

  async validateToken() {
    try {
      // For demo users, just return success
      if (this.isDemoUser()) {
        return {
          success: true,
          user: JSON.parse(localStorage.getItem(AUTH_CONFIG.USER_KEY)),
          token: localStorage.getItem(AUTH_CONFIG.TOKEN_KEY),
        };
      }

      // Regular token validation
      const response = await this.httpClient.post(authEndpoints.validate);
      return response.data;
    } catch (error) {
      console.error('Token validation failed:', error);
      throw error;
    }
  }

  async login(credentials) {
    try {
      const response = await this.httpClient.post(authEndpoints.login, credentials);

      if (response?.data) {
        const { token, refresh_token, user } = response.data;

        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
        if (refresh_token) {
          localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refresh_token);
        }
        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(user));

        if (this.httpClient?.defaults?.headers?.common) {
          this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        return {
          success: true,
          token,
          refresh_token,
          user,
        };
      }

      throw new Error('Invalid response from login endpoint');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await this.httpClient.post(authEndpoints.register, userData);
      this.handleAuthResponse(response.data);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      // If demo user, just clean up local data
      if (this.isDemoUser()) {
        demoService.cleanup();
        return;
      }

      // Regular logout
      await this.httpClient.post(authEndpoints.logout);
      this.clearAuthData();
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local data even if API call fails
      this.clearAuthData();
      throw error;
    }
  }

  handleAuthResponse(data) {
    if (data.token) {
      this.token = data.token;
      localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, data.token);
    }
    if (data.refresh_token) {
      this.refreshToken = data.refresh_token;
      localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, data.refresh_token);
    }
    if (data.user) {
      this.user = data.user;
      localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(data.user));
    }
    // Reset validation cache
    tokenValidationCache.lastValidation = null;
    tokenValidationCache.isValid = false;
  }

  clearAuthData() {
    this.token = null;
    this.refreshToken = null;
    this.user = null;
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);
    // Reset validation cache
    tokenValidationCache.lastValidation = null;
    tokenValidationCache.isValid = false;

    if (this.httpClient?.defaults?.headers?.common) {
      delete this.httpClient.defaults.headers.common['Authorization'];
    }
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  isDemoUser() {
    return demoService.isDemoSession();
  }

  /**
   * Handle demo login
   */
  async demoLogin() {
    try {
      console.log('Starting demo login process');
      const response = await demoService.login();

      if (response?.success) {
        // Set http client auth header
        if (httpClient?.defaults?.headers?.common) {
          httpClient.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
        }
      }

      return response;
    } catch (error) {
      console.error('Demo login error:', error);
      throw error;
    }
  }

  /**
   * Refresh token if needed
   */
  async refreshTokenIfNeeded() {
    try {
      // For demo users, just return success with new demo data
      if (this.isDemoUser()) {
        const response = await demoService.login();
        return {
          success: true,
          token: response.token,
          refresh_token: response.refresh_token,
        };
      }

      // Regular token refresh
      const response = await this.httpClient.post(authEndpoints.refresh);
      return response.data;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export individual methods for backward compatibility
export const login = (credentials) => authService.login(credentials);
export const register = (userData) => authService.register(userData);
export const logout = () => authService.logout();
export const validateToken = () => authService.validateToken();
export const clearAuthData = () => authService.clearAuthData();
export const checkIsAuthenticated = () => authService.isAuthenticated();
export const checkIsDemoUser = () => authService.isDemoUser();
export const demoLogin = () => authService.demoLogin();

/**
 * Completely reset the authentication state
 * Use this function when experiencing auth issues or for testing
 * Can be called from browser console: authService.resetAuth()
 */
export function resetAuth() {
  // Clear all authentication data
  clearAuthData();

  // Also clear any other auth-related items in localStorage
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      (key.includes('token') ||
        key.includes('auth') ||
        key.includes('user') ||
        key.includes('login'))
    ) {
      keysToRemove.push(key);
    }
  }

  // Remove all matched keys
  keysToRemove.forEach((key) => localStorage.removeItem(key));

  console.log('Authentication state completely reset. Please refresh the page and log in again.');
  return { success: true, message: 'Auth reset complete' };
}

/**
 * Check if user is currently authenticated with better error handling
 * @returns {boolean} - True if user has a stored token
 */
export const isAuthenticated = () => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem(TOKEN_KEY);

    // Check for token verification failure flag
    const tokenFailed = localStorage.getItem(TOKEN_VERIFICATION_FAILED);

    // Only consider authenticated if token exists and hasn't failed verification
    return !!token && tokenFailed !== 'true';
  } catch (error) {
    // Handle edge cases like localStorage being unavailable
    console.error('Error checking authentication status:', error);
    return false;
  }
};

/**
 * Get the current auth token from storage
 * @returns {string|null} The auth token or null if not found
 */
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

/**
 * Decode and check a JWT token locally without server validation
 * @param {string} token - The token to check
 * @returns {Object} The decoded token payload or null if invalid
 */
export function decodeToken(token) {
  if (!token) return null;

  try {
    // Split the token into its parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format - not a JWT');
      return null;
    }

    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));

    // Check if token is expired
    if (payload.exp) {
      const expiryDate = new Date(payload.exp * 1000); // Convert to milliseconds
      const now = new Date();

      if (now > expiryDate) {
        console.log('Token is expired', {
          expiry: expiryDate.toISOString(),
          now: now.toISOString(),
          expired: true,
        });
        return { ...payload, expired: true };
      }
    }

    return payload;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Check if a token is valid locally (exists and not expired)
 * Useful as a quick check before making API calls
 * @returns {boolean} True if token exists and is not expired
 */
export function hasValidToken() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;

    // Check if this is a demo session by examining the token format
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        // Decode the payload to check if it's a demo token
        const payload = JSON.parse(atob(parts[1]));
        if (
          payload.sub &&
          (payload.sub.includes('demo-') ||
            payload.sub.includes('demo_') ||
            payload.sub === 'demo-user')
        ) {
          console.log('Demo token detected in hasValidToken, considering valid');
          return true;
        }
      }
    } catch (e) {
      // If token parsing fails, continue with regular validation
    }

    const decoded = decodeToken(token);
    if (!decoded) return false;

    // If token is expired, try to silently refresh it
    if (decoded.expired) {
      // Don't wait for the promise to resolve - this is a quick check only
      refreshToken().catch((err) => {
        console.log('Background token refresh failed:', err.message);
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking token validity:', error);
    return false;
  }
}
