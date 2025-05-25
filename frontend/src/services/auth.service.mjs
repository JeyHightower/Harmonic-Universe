/**
 * Auth Service
 * Handles authentication operations like login, register, token validation
 */

import Logger from '../utils/logger';
import { API_SERVICE_CONFIG } from './config';
import { authEndpoints } from './endpoints';
import { httpClient } from './http-client';
import { responseHandler } from './response-handler';

// Constants for token-related localStorage keys
const TOKEN_KEY = API_SERVICE_CONFIG.AUTH.TOKEN_KEY;
const REFRESH_TOKEN_KEY = API_SERVICE_CONFIG.AUTH.REFRESH_TOKEN_KEY;
const USER_KEY = API_SERVICE_CONFIG.AUTH.USER_KEY;
const TOKEN_VERIFICATION_FAILED = 'token_verification_failed';

// Add this to handle token refresh race conditions

/**
 * Perform user login
 *- Either user email or credentials object with email and password
 * @param {string} [password] - User password (if first param is email)
 * @returns {Promise<object>} - Login response with auth token
 */
export const login = async (emailOrCredentials, password) => {
  try {
    let loginData = {};

    // Handle both formats: (email, password) or ({email, password})
    if (typeof emailOrCredentials === 'string') {
      loginData = { email: emailOrCredentials, password };
    } else if (typeof emailOrCredentials === 'object') {
      loginData = emailOrCredentials;
    } else {
      throw new Error('Invalid login parameters');
    }

    // Validate required fields
    if (!loginData.email) {
      throw new Error('Email is required for login');
    }

    if (!loginData.password) {
      throw new Error('Password is required for login');
    }

    const response = await httpClient.post(authEndpoints.login, loginData);

    // Handle successful login
    if (response.token) {
      // Clear any previous token verification failures
      localStorage.removeItem(TOKEN_VERIFICATION_FAILED);

      // Store token in localStorage
      localStorage.setItem(TOKEN_KEY, response.token);

      // Store refresh token if provided, otherwise don't create a fallback
      if (response.refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
      }

      // Log successful login
      Logger.log('auth', 'User logged in successfully', {
        email: loginData.email,
        tokenLength: response.token.length,
        tokenPreview: `${response.token.substring(0, 5)}...${response.token.substring(response.token.length - 5)}`,
      });

      return responseHandler.handleSuccess(response);
    }

    return responseHandler.handleSuccess(response);
  } catch (error) {
    // Use console.error instead of Logger.error until we fix the logger
    console.error('Login failed:', error);
    return responseHandler.handleError(error);
  }
};

/**
 * Register a new user
 * @param {object} userData - User registration data
 * @returns {Promise<object>} - Registration response
 */
export const register = async (userData) => {
  try {
    const response = await httpClient.post(authEndpoints.register, userData);
    return responseHandler.handleSuccess(response);
  } catch (error) {
    Logger.logError('Registration failed', error, 'auth');
    return responseHandler.handleError(error);
  }
};

/**
 * Handle demo login (no server interaction)
 */
export async function demoLogin() {
  try {
    // Import the demo user service
    const { demoUserService } = await import(/* @vite-ignore */ './demo-user.service.mjs');

    // Use the demo user service to set up the demo session
    const demoData = demoUserService.setupDemoSession();

    // Log successful login
    console.log('Demo login successful');
    Logger.log('auth', 'User logged in with demo account');

    // Set http client auth header
    if (httpClient?.defaults?.headers?.common) {
      httpClient.defaults.headers.common['Authorization'] = `Bearer ${demoData.token}`;
    }

    return {
      success: true,
      token: demoData.token,
      refresh_token: demoData.refresh_token,
      user: demoData.user,
      message: 'Demo login successful',
    };
  } catch (error) {
    console.error('Demo login error:', error);
    return {
      success: false,
      message: 'Error during demo login',
    };
  }
}

/**
 * Log the user out and clear all auth data
 * @returns {Promise<Object>} Result of the logout operation
 */
export const logout = async () => {
  try {
    // Call logout endpoint if needed
    const response = await httpClient.post(authEndpoints.logout);

    // Clear all auth data
    clearAuthData();

    // Redirect to login page if needed
    if (window && window.location) {
      window.location.href = '/login';
    }

    return responseHandler.handleSuccess(response);
  } catch (error) {
    // Still clear auth data even if the logout request fails
    clearAuthData();

    // Redirect to login page if needed
    if (window && window.location) {
      window.location.href = '/login';
    }

    return responseHandler.handleError(error);
  }
};

/**
 * Refresh the access token using the refresh token
 * @returns {Promise<string>} New access token
 */
export async function refreshToken() {
  // Add retry mechanism and token lock to prevent concurrent refresh attempts
  if (typeof window !== 'undefined' && window.__TOKEN_REFRESH_IN_PROGRESS) {
    console.log('Token refresh already in progress, waiting for it to complete');

    // Return a promise that resolves when the existing refresh completes
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (!window.__TOKEN_REFRESH_IN_PROGRESS) {
          clearInterval(checkInterval);

          // Get the result of the completed refresh
          const token = localStorage.getItem(TOKEN_KEY);
          if (token) {
            resolve(token);
          } else {
            reject(new Error('No token available after refresh completed'));
          }
        }
      }, 100);

      // Set a timeout to avoid infinite waiting
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Timed out waiting for token refresh'));
      }, 5000);
    });
  }

  // Set the global flag to indicate a refresh is in progress
  if (typeof window !== 'undefined') {
    window.__TOKEN_REFRESH_IN_PROGRESS = true;
  }

  try {
    // FIRST PRIORITY: Check if this is a demo session - do this before anything else
    const currentToken = localStorage.getItem(TOKEN_KEY);
    const currentRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const currentUser = localStorage.getItem(USER_KEY);

    console.log('Debug - refreshToken: Initial authentication state:', {
      hasCurrentToken: !!currentToken,
      hasRefreshToken: !!currentRefreshToken,
      hasUser: !!currentUser,
      currentTokenPreview: currentToken ? `${currentToken.substring(0, 20)}...` : 'none',
      refreshTokenPreview: currentRefreshToken
        ? `${currentRefreshToken.substring(0, 20)}...`
        : 'none',
      userPreview: currentUser ? JSON.parse(currentUser).username || 'no username' : 'none',
    });

    // Use a more direct demo session check
    let isDemoSession = false;
    if (currentToken) {
      try {
        const parts = currentToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          isDemoSession =
            payload.sub &&
            (payload.sub.includes('demo-') ||
              payload.sub.includes('demo_') ||
              payload.sub === 'demo-user');
        }
      } catch (e) {
        // If JWT parsing fails, check for legacy demo tokens
        isDemoSession =
          currentToken.startsWith('demo-') ||
          currentToken.includes('demo_token_') ||
          currentToken.includes('demo-token-');
      }
    }

    console.log('Debug - refreshToken: isDemoSession =', isDemoSession);

    if (isDemoSession) {
      console.log('Demo session detected in refreshToken, regenerating demo tokens');
      const { demoUserService } = await import('./demo-user.service.mjs');
      const demoData = demoUserService.setupDemoSession();
      return demoData.token;
    }

    // Only proceed with regular token refresh if NOT a demo session
    let refreshTokenValue = localStorage.getItem(REFRESH_TOKEN_KEY);

    console.log('Debug - refreshToken: About to check refresh token availability:', {
      hasRefreshToken: !!refreshTokenValue,
      refreshTokenLength: refreshTokenValue ? refreshTokenValue.length : 0,
    });

    // If no refresh token is available, we can't refresh
    if (!refreshTokenValue) {
      console.error('No refresh token available for token refresh');
      // Set a flag to indicate token verification failed
      localStorage.setItem(TOKEN_VERIFICATION_FAILED, 'true');
      throw new Error('No refresh token available');
    }

    // Ensure the refresh token is in valid JWT format (has 3 segments)
    const tokenParts = refreshTokenValue.split('.');
    if (tokenParts.length !== 3) {
      console.error('Invalid refresh token format - not a valid JWT token');
      // Clear the invalid token
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      // Set a flag to indicate token verification failed
      localStorage.setItem(TOKEN_VERIFICATION_FAILED, 'true');
      throw new Error('Invalid refresh token format');
    }

    // Use the correct endpoint from authEndpoints
    const refreshEndpoint = authEndpoints.refresh;
    console.log('Using refresh endpoint:', refreshEndpoint);

    // Add detailed logging for debugging
    console.log('Refreshing token:', {
      endpoint: refreshEndpoint,
      hasCurrentToken: !!currentToken,
      refreshTokenLength: refreshTokenValue.length,
    });

    try {
      // First attempt with standard endpoint
      const response = await httpClient.post(
        refreshEndpoint,
        { refresh_token: refreshTokenValue },
        {
          headers: {
            Authorization: currentToken ? `Bearer ${currentToken}` : undefined,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );

      // Extract token from response
      const tokenData = response.data || response;
      const newToken = tokenData.token || tokenData.access_token;
      const newRefreshToken = tokenData.refresh_token;

      // Handle successful refresh
      if (newToken) {
        console.log('Token refreshed successfully');
        localStorage.setItem(TOKEN_KEY, newToken);
        if (newRefreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        }
        if (tokenData.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(tokenData.user));
        }
        localStorage.removeItem(TOKEN_VERIFICATION_FAILED);
        return newToken;
      } else {
        console.error('No token in refresh response:', tokenData);
        throw new Error('Invalid refresh response: No token returned');
      }
    } catch (error) {
      // If first attempt fails with 405 Method Not Allowed, try alternative endpoint format
      if (error.response?.status === 405) {
        console.warn('Method not allowed on primary endpoint, trying alternative format');

        // Create the alternate endpoint by toggling the trailing slash
        const alternateEndpoint = refreshEndpoint.endsWith('/')
          ? refreshEndpoint.slice(0, -1)
          : refreshEndpoint + '/';

        console.log('Attempting with alternate endpoint:', alternateEndpoint);

        // Try the alternate endpoint
        const retryResponse = await httpClient.post(
          alternateEndpoint,
          { refresh_token: refreshTokenValue },
          {
            headers: {
              Authorization: currentToken ? `Bearer ${currentToken}` : undefined,
              'Content-Type': 'application/json',
            },
            withCredentials: true,
          }
        );

        // Handle the response
        const tokenData = retryResponse.data || retryResponse;
        const newToken = tokenData.token || tokenData.access_token;
        const newRefreshToken = tokenData.refresh_token;

        if (newToken) {
          console.log('Token refreshed successfully with alternate endpoint');
          localStorage.setItem(TOKEN_KEY, newToken);
          if (newRefreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
          }
          if (tokenData.user) {
            localStorage.setItem(USER_KEY, JSON.stringify(tokenData.user));
          }
          localStorage.removeItem(TOKEN_VERIFICATION_FAILED);
          return newToken;
        } else {
          throw new Error('No token returned from alternate endpoint');
        }
      } else {
        // Re-throw any other errors
        throw error;
      }
    }
  } catch (error) {
    console.error('Token refresh failed:', error);

    // Check if we should clear auth data
    const shouldClearAuth =
      error.response?.status === 401 || // Unauthorized
      error.response?.status === 403 || // Forbidden
      (error.response?.status === 405 && error.retried) || // Method Not Allowed (after retry)
      error.message?.includes('No refresh token available') ||
      error.message?.includes('Invalid refresh');

    if (shouldClearAuth) {
      console.log('Clearing auth data due to refresh failure');
      clearAuthData();
    }

    throw error;
  } finally {
    // Always clear the in-progress flag
    if (typeof window !== 'undefined') {
      window.__TOKEN_REFRESH_IN_PROGRESS = false;
    }
  }
}

/**
 * Clear all authentication data from localStorage
 */
export function clearAuthData() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_VERIFICATION_FAILED);

  // Clear auth headers
  if (httpClient?.defaults?.headers?.common) {
    delete httpClient.defaults.headers.common['Authorization'];
  }
}

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
 * Validate the current token
 * @param {string} [token] - Optional token to validate (uses stored token if not provided)
 * @returns {Promise<object>} Validation result
 */
export async function validateToken(token = null) {
  if (!token) {
    token = localStorage.getItem(TOKEN_KEY);
  }

  if (!token) {
    return { valid: false, message: 'No token available to validate' };
  }

  try {
    // Check if token is expired by decoding without verification
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const decodedToken = JSON.parse(atob(tokenParts[1]));
      const expirationTime = decodedToken.exp * 1000; // Convert to milliseconds

      // If token is expired, try to refresh before validation
      if (Date.now() >= expirationTime) {
        console.log('Token expired, attempting refresh');
        try {
          const newToken = await refreshToken();
          if (newToken) {
            return { valid: true, refreshed: true, token: newToken };
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);

          // Don't clear auth data on network errors, as they might be temporary
          if (!refreshError.message?.includes('Network Error')) {
            clearAuthData();
          }

          return { valid: false, message: 'Token expired and refresh failed' };
        }
      }
    } catch (parseError) {
      console.warn('Error parsing token:', parseError);
      // Continue with validation even if parsing fails
    }

    // Validate with server
    try {
      // Use a smaller timeout for validation to fail faster
      const response = await httpClient.post(
        authEndpoints.validate,
        { token },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
          timeout: 5000, // 5 second timeout for faster failure
        }
      );

      const validationResult = response.data || response;

      if (validationResult.valid === true) {
        // Update user data if provided
        if (validationResult.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(validationResult.user));
        }

        // Clear any verification failure flags
        localStorage.removeItem(TOKEN_VERIFICATION_FAILED);

        return { valid: true, user: validationResult.user };
      } else {
        throw new Error(validationResult.message || 'Token validation failed');
      }
    } catch (validationError) {
      console.error('Server validation error:', validationError);

      // If it's a network error (possibly CORS), use client-side validation as fallback
      if (validationError.message?.includes('Network Error')) {
        console.warn('Network error during validation, using client-side validation as fallback');

        try {
          // We've already checked expiration above, so if we're here the token isn't expired
          return {
            valid: true,
            user: JSON.parse(localStorage.getItem(USER_KEY) || '{}'),
            clientSideOnly: true,
            message: 'Using client-side validation due to network error',
          };
        } catch (e) {
          console.error('Client-side validation failed:', e);
        }
      }

      // If server returns 401, token is definitely invalid
      if (validationError.response && validationError.response.status === 401) {
        // Try to refresh the token
        try {
          // Check if we have a main token before attempting refresh
          const currentToken = localStorage.getItem(TOKEN_KEY);
          if (!currentToken) {
            console.warn('No token available for refresh after 401');
            clearAuthData();
            return { valid: false, message: 'No token available for validation or refresh' };
          }

          const newToken = await refreshToken();
          if (newToken) {
            return { valid: true, refreshed: true, token: newToken };
          }
        } catch (refreshError) {
          console.error('Token refresh after 401 failed:', refreshError);
          // Don't clear auth on network errors
          if (!refreshError.message?.includes('Network Error')) {
            clearAuthData();
          }
          return { valid: false, message: 'Token invalid and refresh failed' };
        }
      }

      throw validationError;
    }
  } catch (error) {
    console.error('Token validation error:', error);

    // Don't set verification failure on network errors as they might be temporary
    if (!error.message?.includes('Network Error')) {
      localStorage.setItem(TOKEN_VERIFICATION_FAILED, 'true');
    }

    return {
      valid: false,
      message: error.message,
      isNetworkError: error.message?.includes('Network Error'),
    };
  }
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

/**
 * Authentication service object
 */
export const authService = {
  login,
  register,
  demoLogin,
  logout,
  validateToken,
  refreshToken,
  isAuthenticated,
  getToken,
  clearAuthData,
  resetAuth,
  decodeToken,
  hasValidToken,
};

export default authService;
