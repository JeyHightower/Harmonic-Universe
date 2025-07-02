/**
 * Auth Service
 * Handles authentication operations like login, register, token validation
 */

import { AUTH_CONFIG } from '../utils/config';
import { API_SERVICE_CONFIG } from './config.mjs';
import { demoService } from './demo.service.mjs';
import { authEndpoints } from './endpoints.mjs';
import httpClient from './http-client.mjs';

// Constants for token storage
const TOKEN_KEY = API_SERVICE_CONFIG.AUTH.TOKEN_KEY;
const REFRESH_TOKEN_KEY = API_SERVICE_CONFIG.AUTH.REFRESH_TOKEN_KEY;
const USER_KEY = API_SERVICE_CONFIG.AUTH.USER_KEY;
const TOKEN_VERIFICATION_FAILED = 'token_verification_failed';

class AuthService {
  constructor() {
    this.httpClient = httpClient;
    this.token = null;
    this.refreshToken = null;
    this.user = null;
    this.validationCache = {
      lastValidation: null,
      isValid: false,
      validationPromise: null,
      cooldown: 5000, // 5 seconds cooldown between validations
    };

    // Run immediate token cleanup on service initialization
    this.cleanupInvalidTokens();
  }

  /**
   * Aggressively clean invalid tokens from localStorage
   */
  cleanupInvalidTokens() {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const userStr = localStorage.getItem(USER_KEY);

      console.log('AuthService - Checking for invalid tokens on initialization...');

      // Check if token is valid JWT format
      const isValidToken = token && token.split('.').length === 3;

      if (token && !isValidToken) {
        console.log(
          'AuthService - Invalid token detected during initialization, clearing auth data'
        );
        this.clearAuthData();
      } else if (isValidToken) {
        console.log('AuthService - Valid token found during initialization');
      } else {
        console.log('AuthService - No token found during initialization');
      }
    } catch (error) {
      console.error('AuthService - Error during token cleanup:', error);
    }
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
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        console.log('No token available for validation');
        return false;
      }

      // Check if token is valid locally first
      if (!this.isTokenValid(token)) {
        console.log('Token failed local validation');
        this.clearAuthData();
        localStorage.setItem(TOKEN_VERIFICATION_FAILED, 'true');
        return false;
      }

      // Check cache first
      if (this.validationCache.lastValidation) {
        const timeSinceLastValidation = Date.now() - this.validationCache.lastValidation;
        if (timeSinceLastValidation < this.validationCache.cooldown) {
          return this.validationCache.isValid;
        }
      }

      // If there's an ongoing validation, return its promise
      if (this.validationCache.validationPromise) {
        return this.validationCache.validationPromise;
      }

      // Create new validation promise
      this.validationCache.validationPromise = httpClient
        .post(authEndpoints.validate)
        .then((response) => {
          // Check if response exists and has the expected structure
          if (!response || typeof response !== 'object') {
            console.error('Invalid response format from token validation:', response);
            this.validationCache.isValid = false;
            localStorage.setItem(TOKEN_VERIFICATION_FAILED, 'true');
            this.clearAuthData();
            return false;
          }

          // Check if the response has the valid property
          if (typeof response.valid !== 'boolean') {
            console.error('Response missing valid property:', response);
            this.validationCache.isValid = false;
            localStorage.setItem(TOKEN_VERIFICATION_FAILED, 'true');
            this.clearAuthData();
            return false;
          }

          this.validationCache.lastValidation = Date.now();
          this.validationCache.isValid = response.valid;

          // Clear token verification failed flag if validation succeeds
          if (response.valid) {
            localStorage.removeItem(TOKEN_VERIFICATION_FAILED);
          } else {
            // Set token verification failed flag if validation fails
            localStorage.setItem(TOKEN_VERIFICATION_FAILED, 'true');
            this.clearAuthData();
          }

          return response.valid;
        })
        .catch((error) => {
          console.error('Token validation error:', error);
          localStorage.setItem(TOKEN_VERIFICATION_FAILED, 'true');
          this.clearAuthData();
          return false;
        })
        .finally(() => {
          this.validationCache.validationPromise = null;
        });

      return this.validationCache.validationPromise;
    } catch (error) {
      console.error('Error validating token:', error);
      localStorage.setItem(TOKEN_VERIFICATION_FAILED, 'true');
      this.clearAuthData();
      return false;
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
    this.validationCache.lastValidation = null;
    this.validationCache.isValid = false;
  }

  clearAuthData() {
    // Clear all auth-related data
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_VERIFICATION_FAILED);

    // Reset instance variables
    this.token = null;
    this.refreshToken = null;
    this.user = null;

    // Reset validation cache
    this.validationCache = {
      lastValidation: null,
      isValid: false,
      validationPromise: null,
      cooldown: 5000,
    };

    if (this.httpClient?.defaults?.headers?.common) {
      delete this.httpClient.defaults.headers.common['Authorization'];
    }
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  isDemoUser() {
    return demoService.isValidDemoSession();
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
      console.log('Debug - refreshTokenIfNeeded: Starting token refresh');

      // For demo users, just return success with new demo data
      if (this.isDemoUser()) {
        console.log('Debug - refreshTokenIfNeeded: Demo user detected, using demo service');
        const response = await demoService.login();
        return {
          success: true,
          token: response.token,
          refresh_token: response.refresh_token,
        };
      }

      // Regular token refresh
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const accessToken = localStorage.getItem(TOKEN_KEY);

      console.log('Debug - refreshTokenIfNeeded: Token check', {
        hasRefreshToken: !!refreshToken,
        hasAccessToken: !!accessToken,
        refreshTokenLength: refreshToken?.length || 0,
        accessTokenLength: accessToken?.length || 0,
      });

      if (!refreshToken) {
        console.error('Debug - refreshTokenIfNeeded: No refresh token available');
        throw new Error('No refresh token available');
      }

      // Debug logging
      console.log('Debug - refreshTokenIfNeeded:', {
        hasRefreshToken: !!refreshToken,
        refreshTokenLength: refreshToken.length,
        refreshTokenPreview: refreshToken.substring(0, 50) + '...',
        refreshTokenParts: refreshToken.split('.').length,
      });

      // Validate refresh token format
      const tokenParts = refreshToken.split('.');
      if (tokenParts.length !== 3) {
        console.error('Invalid refresh token format - not a valid JWT');
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        throw new Error('Invalid refresh token format');
      }

      // Try to decode the refresh token payload for debugging
      try {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('Debug - refreshTokenIfNeeded: Refresh token payload', {
          sub: payload.sub,
          exp: payload.exp,
          iat: payload.iat,
          type: payload.type,
          expired: payload.exp ? new Date(payload.exp * 1000) < new Date() : false,
        });
      } catch (e) {
        console.error('Debug - refreshTokenIfNeeded: Could not decode refresh token payload', e);
      }

      console.log(
        'Debug - refreshTokenIfNeeded: Sending refresh request to',
        authEndpoints.refresh
      );

      // Send refresh token in the Authorization header as required by backend
      const response = await httpClient.post(
        authEndpoints.refresh,
        {},
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        }
      );

      console.log('Debug - refreshTokenIfNeeded: Refresh response received', {
        success: response.success,
        hasAccessToken: !!response.access_token,
        hasToken: !!response.token,
        responseKeys: Object.keys(response || {}),
      });

      return response.data;
    } catch (error) {
      console.error('Token refresh failed:', error);
      console.error('Debug - refreshTokenIfNeeded: Error details', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      throw error;
    }
  }

  // Check if a token is valid locally
  isTokenValid(token) {
    if (!token) {
      console.log('isTokenValid: No token provided');
      return false;
    }

    try {
      // Log the token value before validation
      console.log('isTokenValid: Validating token:', token);
      // Split the token into its parts
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid token format - not a JWT');
        // Clear the invalid token immediately
        this.clearAuthData();
        return false;
      }

      // Decode the payload (second part)
      const payload = JSON.parse(atob(parts[1]));

      // DEMO TOKEN LOGIC: Check if this is a demo user by checking the user data in localStorage
      // The backend creates a real user with a real ID, so we check the user email instead
      try {
        const userStr = localStorage.getItem(USER_KEY);
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user?.email === 'demo@example.com') {
            console.log('Demo user detected in isTokenValid, considering valid');
            return true;
          }
        }
      } catch (e) {
        // If we can't parse user data, continue with regular validation
      }

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
          // Clear expired token
          this.clearAuthData();
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking token validity:', error);
      // Clear invalid token
      this.clearAuthData();
      return false;
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

    // Check if this is a demo session by checking the user data in localStorage
    try {
      const userStr = localStorage.getItem(USER_KEY);
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user?.email === 'demo@example.com') {
          console.log('Demo user detected in hasValidToken, considering valid');
          return true;
        }
      }
    } catch (e) {
      // If we can't parse user data, continue with regular validation
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

/**
 * Check if a token is valid and not expired
 * @param {string} token - The token to check
 * @returns {boolean} - True if token is valid and not expired
 */
export const isTokenValid = (token) => {
  if (!token) return false;

  try {
    // Split the token into its parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format - not a JWT');
      return false;
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
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error checking token validity:', error);
    return false;
  }
};
