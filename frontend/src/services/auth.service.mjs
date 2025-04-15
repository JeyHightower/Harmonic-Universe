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

/**
 * Perform user login
 * @param {object|string} emailOrCredentials - Either user email or credentials object with email and password
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
 * Log out current user with debouncing to prevent rate limiting
 * @returns {Promise<object>} - Logout response
 */
// Track last logout attempt time
let lastLogoutAttempt = 0;
const LOGOUT_COOLDOWN = 2000; // 2 seconds cooldown

export const logout = async () => {
  try {
    const now = Date.now();
    
    // Check if we're trying to logout too frequently
    if (now - lastLogoutAttempt < LOGOUT_COOLDOWN) {
      Logger.log('auth', 'Logout throttled - too many requests');
      // Still clear auth data to ensure user is logged out locally
      clearAuthData();
      
      // Return a synthetic success response without calling the API
      return responseHandler.handleSuccess({ 
        message: "Logged out successfully (local only)", 
        local_only: true 
      });
    }
    
    // Update timestamp for throttling
    lastLogoutAttempt = now;
    
    // Get token to check if it's a demo token
    const token = localStorage.getItem(TOKEN_KEY);
    const isDemoToken = demoUserService.isDemoSession();
    
    // For demo tokens, just handle locally
    if (isDemoToken) {
      Logger.log('auth', 'Logging out demo user (client-side only)');
      demoUserService.endDemoSession();
      
      return responseHandler.handleSuccess({ 
        message: "Demo user logged out successfully",
        success: true 
      });
    }
    
    // Call logout endpoint for regular tokens
    const response = await httpClient.post(authEndpoints.logout);
    
    // Clear auth data regardless of response
    clearAuthData();
    
    Logger.log('auth', 'User logged out successfully');
    return responseHandler.handleSuccess(response);
  } catch (error) {
    // Still clear auth data even if logout fails
    clearAuthData();
    
    Logger.logError('Logout failed', error, 'auth');
    return responseHandler.handleError(error);
  }
};

/**
 * Validate the current token
 */
export async function validateToken(token = null) {
  if (!token) {
    token = localStorage.getItem('token');
  }
  
  if (!token) {
    return { valid: false, message: 'No token available to validate' };
  }
  
  try {
    // Send token in multiple ways to ensure it's received by the backend
    const response = await httpClient.post('/auth/token/validate', 
      { token }, // In body
      { 
        headers: { 
          'Authorization': `Bearer ${token}`, // In header
          'Content-Type': 'application/json' 
        }
      }
    );
    
    if (response.data.valid) {
      // If user data was returned, update it in storage
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return { valid: true, user: response.data.user };
    } else {
      // Clear token and user data if invalid
      clearAuthData();
      return { valid: false, message: response.data.message || 'Token invalid' };
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
 * @returns {Promise<ApiResponse>} - The API response
 */
export async function refreshToken() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return { success: false, message: 'No token to refresh' };
  }
  
  try {
    console.log('Attempting to refresh token...');
    // Send token in multiple ways to ensure it's received
    const response = await httpClient.post('/auth/token/refresh', 
      { token }, // In body
      { 
        headers: { 
          'Authorization': `Bearer ${token}` // In header
        },
        withCredentials: true // Ensure cookies are sent
      }
    );
    
    if (response && response.data && response.data.token) {
      console.log('Token refreshed successfully');
      localStorage.setItem('token', response.data.token);
      
      // If user data was returned, update it
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return { 
        success: true, 
        data: { 
          token: response.data.token, 
          user: response.data.user
        } 
      };
    } else {
      console.error('Invalid response format from token refresh endpoint');
      return { 
        success: false, 
        message: 'Invalid response from token refresh endpoint' 
      };
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    return responseHandler.handleError(error);
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
    return !!token && tokenFailed !== "true";
  } catch (error) {
    // Handle edge cases like localStorage being unavailable
    console.error("Error checking authentication status:", error);
    return false;
  }
};

/**
 * Get the current auth token with better error handling
 * @returns {string|null} - Current auth token or null
 */
export const getToken = () => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem(TOKEN_KEY);
    
    // Check for token verification failure flag
    const tokenFailed = localStorage.getItem(TOKEN_VERIFICATION_FAILED);
    
    // Return null if token has failed verification
    if (tokenFailed === "true") {
      console.warn("Token verification previously failed, returning null");
      return null;
    }
    
    return token;
  } catch (error) {
    // Handle edge cases like localStorage being unavailable
    console.error("Error getting token:", error);
    return null;
  }
};

/**
 * Clear all authentication data from localStorage
 * This centralizes the logout cleanup to ensure consistency
 */
export const clearAuthData = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_VERIFICATION_FAILED);
    
    // Clear any cached data if httpClient has clearCache method
    if (typeof httpClient.clearCache === 'function') {
      httpClient.clearCache();
    }
    
    // Notify the app about signout
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:signout'));
    }
    
    return true;
  } catch (error) {
    console.error("Error clearing auth data:", error);
    return false;
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