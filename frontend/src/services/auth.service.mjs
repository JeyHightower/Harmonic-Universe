/**
 * Auth Service
 * Handles authentication operations like login, register, token validation
 */

import Logger from "../utils/logger";
import { httpClient } from './http-client';
import { authEndpoints } from './endpoints';
import { responseHandler } from './response-handler';
import { API_SERVICE_CONFIG } from './config';
import { demoUserService } from './demo-user.service.mjs';

// Constants for token-related localStorage keys
const TOKEN_KEY = API_SERVICE_CONFIG.AUTH.TOKEN_KEY;
const REFRESH_TOKEN_KEY = API_SERVICE_CONFIG.AUTH.REFRESH_TOKEN_KEY;
const USER_KEY = API_SERVICE_CONFIG.AUTH.USER_KEY;
const TOKEN_VERIFICATION_FAILED = "token_verification_failed";

// Add this to handle token refresh race conditions
let isRefreshing = false;
let refreshPromise = null;

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
      
      // Create a refresh token if none is provided (for backward compatibility)
      if (!response.refresh_token && !localStorage.getItem(REFRESH_TOKEN_KEY)) {
        // Generate a simple refresh token based on the main token
        const simpleRefreshToken = `refresh_${response.token.substring(0, 20)}`;
        localStorage.setItem(REFRESH_TOKEN_KEY, simpleRefreshToken);
        console.log('Created dummy refresh token for backward compatibility');
      } else if (response.refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
      }
      
      // Log successful login
      Logger.log('auth', 'User logged in successfully', { 
        email: loginData.email, 
        tokenLength: response.token.length,
        tokenPreview: `${response.token.substring(0, 5)}...${response.token.substring(response.token.length - 5)}`
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
 * Log in as a demo user
 * @returns {Promise<object>} - Demo login response
 */
export const demoLogin = async () => {
  try {
    // Use the dedicated demo user service
    const demoResponse = await demoUserService.performDemoLogin();
    
    if (demoResponse.success) {
      Logger.log('auth', 'Demo user logged in successfully');
      return responseHandler.handleSuccess(demoResponse.data);
    } else {
      Logger.logError('Demo login failed', demoResponse.error);
      return responseHandler.handleError(new Error(demoResponse.error || 'Demo login failed'));
    }
  } catch (error) {
    Logger.logError('Demo login failed', error, 'auth');
    return responseHandler.handleError(error);
  }
};

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
 * Validate the current token
 */
export async function validateToken(token = null) {
  if (!token) {
    token = localStorage.getItem(TOKEN_KEY);
  }
  
  if (!token) {
    return { valid: false, message: 'No token available to validate' };
  }
  
  try {
    // Check if token is a demo token using demoUserService
    if (demoUserService.isDemoSession()) {
      console.log('Validating demo token - considered valid without server check');
      return { valid: true, demo: true };
    }
    
    // Use the correct endpoint from authEndpoints
    const validateEndpoint = authEndpoints.validate;
    console.log('Using validate endpoint:', validateEndpoint);
    
    // Send token in multiple ways to ensure it's received by the backend
    const response = await httpClient.post(validateEndpoint, 
      { token }, // In body
      { 
        headers: { 
          'Authorization': `Bearer ${token}`, // In header
          'Content-Type': 'application/json' 
        },
        withCredentials: true, // Ensure cookies are sent and received
        // Don't retry validation to avoid loops
        maxRetries: 0
      }
    );
    
    console.log('Token validation response:', response);
    
    if (response.data && response.data.valid) {
      // If user data was returned, update it in storage
      if (response.data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
      }
      return { valid: true, user: response.data.user };
    } else if (response.valid) {
      // Handle different response format
      if (response.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      }
      return { valid: true, user: response.user };
    } else {
      // Clear token and user data if invalid
      clearAuthData();
      return { valid: false, message: (response.data && response.data.message) || 'Token invalid' };
    }
  } catch (error) {
    console.error('Error validating token:', error);
    
    // Check for specific error conditions
    if (error.response) {
      if (error.response.status === 401) {
        clearAuthData();
        return { valid: false, message: 'Token expired or invalid' };
      }
      
      // CORS or server error
      if (error.response.status === 0 || error.response.status >= 500) {
        // Don't clear auth data for server errors, might be temporary
        return { valid: false, message: 'Server error during validation' };
      }
    }
    
    // Network error could be CORS issue
    if (error.message && error.message.includes('Network Error')) {
      return { valid: false, message: 'Network error (possibly CORS)' };
    }
    
    // Default case: clear data and return invalid
    clearAuthData();
    return { valid: false, message: 'Unknown error during token validation' };
  }
}

/**
 * Refresh authentication token
 * @returns {Promise<Object>} - New token data
 */
export const refreshToken = async () => {
  // If a refresh is already in progress, wait for it to complete instead of starting a new one
  if (isRefreshing) {
    return refreshPromise;
  }
  
  try {
    // Set the flag to indicate a refresh is in progress
    isRefreshing = true;
    
    // Create a promise that will be shared by all concurrent calls
    refreshPromise = httpClient.post(authEndpoints.refresh)
      .then(response => {
        const result = responseHandler.handleSuccess(response);
        return result;
      })
      .catch(error => {
        console.error('Token refresh failed:', error);
        return responseHandler.handleError(error);
      })
      .finally(() => {
        // Reset the flag once the refresh is complete
        isRefreshing = false;
        refreshPromise = null;
      });
    
    return refreshPromise;
  } catch (error) {
    isRefreshing = false;
    refreshPromise = null;
    console.error('Error in refreshToken:', error);
    return responseHandler.handleError(error);
  }
};

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
    return !!token && tokenFailed !== "true";
  } catch (error) {
    // Handle edge cases like localStorage being unavailable
    console.error("Error checking authentication status:", error);
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
 * Clear all authentication data from storage
 */
export const clearAuthData = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

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
};

export default authService; 