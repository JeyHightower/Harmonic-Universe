/**
 * Auth Service
 * Handles authentication operations like login, register, token validation
 */

import Logger from "../utils/logger";
import { httpClient } from './http-client';
import { authEndpoints } from './endpoints';
import { responseHandler } from './response-handler';
import { API_SERVICE_CONFIG } from './config';

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
      localStorage.removeItem("token_verification_failed");
      
      // Store token in localStorage
      localStorage.setItem(API_SERVICE_CONFIG.AUTH.TOKEN_KEY, response.token);
      
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
    const response = await httpClient.post(authEndpoints.demoLogin, {});
    
    // Handle successful demo login
    if (response.token) {
      // Clear any previous token verification failures
      localStorage.removeItem("token_verification_failed");
      
      // Store token in localStorage
      localStorage.setItem(API_SERVICE_CONFIG.AUTH.TOKEN_KEY, response.token);
      
      Logger.log('auth', 'Demo user logged in successfully');
      return responseHandler.handleSuccess(response);
    } else {
      Logger.logError('Demo login failed - No token in response', response);
      return responseHandler.handleError(new Error('No token received from server'));
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
      // Still remove token to ensure user is logged out locally
      localStorage.removeItem(API_SERVICE_CONFIG.AUTH.TOKEN_KEY);
      localStorage.removeItem(API_SERVICE_CONFIG.AUTH.USER_KEY);
      localStorage.removeItem(API_SERVICE_CONFIG.AUTH.REFRESH_TOKEN_KEY);
      httpClient.clearCache();
      
      // Return a synthetic success response without calling the API
      return responseHandler.handleSuccess({ 
        message: "Logged out successfully (local only)", 
        local_only: true 
      });
    }
    
    // Update timestamp for throttling
    lastLogoutAttempt = now;
    
    // Get token to check if it's a demo token
    const token = localStorage.getItem(API_SERVICE_CONFIG.AUTH.TOKEN_KEY);
    const isDemoToken = token && (token.startsWith('demo-') || token.includes('demo'));
    
    // For demo tokens, just handle locally
    if (isDemoToken) {
      Logger.log('auth', 'Logging out demo user (client-side only)');
      localStorage.removeItem(API_SERVICE_CONFIG.AUTH.TOKEN_KEY);
      localStorage.removeItem(API_SERVICE_CONFIG.AUTH.USER_KEY);
      localStorage.removeItem(API_SERVICE_CONFIG.AUTH.REFRESH_TOKEN_KEY);
      httpClient.clearCache();
      
      return responseHandler.handleSuccess({ 
        message: "Demo user logged out successfully",
        success: true 
      });
    }
    
    // Call logout endpoint for regular tokens
    const response = await httpClient.post(authEndpoints.logout);
    
    // Clear auth token regardless of response
    localStorage.removeItem(API_SERVICE_CONFIG.AUTH.TOKEN_KEY);
    localStorage.removeItem(API_SERVICE_CONFIG.AUTH.USER_KEY);
    localStorage.removeItem(API_SERVICE_CONFIG.AUTH.REFRESH_TOKEN_KEY);
    
    // Clear any cached data
    httpClient.clearCache();
    
    Logger.log('auth', 'User logged out successfully');
    return responseHandler.handleSuccess(response);
  } catch (error) {
    // Still remove token even if logout fails
    localStorage.removeItem(API_SERVICE_CONFIG.AUTH.TOKEN_KEY);
    localStorage.removeItem(API_SERVICE_CONFIG.AUTH.USER_KEY);
    localStorage.removeItem(API_SERVICE_CONFIG.AUTH.REFRESH_TOKEN_KEY);
    
    Logger.logError('Logout failed', error, 'auth');
    return responseHandler.handleError(error);
  }
};

/**
 * Validate the current token
 */
export const validateToken = async () => {
  try {
    // Check if there's already a token verification failure flag set
    if (localStorage.getItem("token_verification_failed") === "true") {
      Logger.log('auth-service', 'Token verification previously failed, returning false');
      return false;
    }

    // Get token from localStorage
    const token = getToken();
    
    if (!token) {
      Logger.log('auth-service', 'No token found in localStorage');
      return false;
    }
    
    // Handle demo tokens locally without calling the server
    if (token.startsWith('demo-') || token.includes('demo')) {
      Logger.log('auth-service', 'Demo token detected, validating locally');
      // Demo tokens are always considered valid
      return true;
    }
    
    // Call the validate endpoint for non-demo tokens
    const response = await httpClient.post('/auth/validate', null, { 
      headers: { 'Authorization': `Bearer ${token}` },
      // Disable retry for token validation to prevent excessive calls
      maxRetries: 0
    });
    
    // If successful, clear any previous token verification failure flag
    localStorage.removeItem("token_verification_failed");
    
    return response.data?.valid || false;
  } catch (error) {
    // Check for specific signature verification failures
    const isSignatureError = 
      error.message?.includes('Signature verification failed') || 
      error.response?.data?.message?.includes('Signature verification failed');
    
    if (isSignatureError) {
      Logger.logError('Token signature verification failed - token is invalid', error);
      // Set token verification failed flag
      localStorage.setItem("token_verification_failed", "true");
    } else {
      Logger.logError('Token validation error (non-signature issue)', error);
    }
    
    // Clear authorization related data from localStorage
    localStorage.removeItem(API_SERVICE_CONFIG.AUTH.TOKEN_KEY);
    localStorage.removeItem(API_SERVICE_CONFIG.AUTH.USER_KEY);
    localStorage.removeItem(API_SERVICE_CONFIG.AUTH.REFRESH_TOKEN_KEY);
    
    return false;
  }
};

/**
 * Refresh authentication token
 * @returns {Promise<ApiResponse>} - The API response
 */
export const refreshToken = async () => {
  try {
    console.log('Attempting to refresh authentication token');
    
    // Get the refresh token from localStorage
    const refreshToken = localStorage.getItem(API_SERVICE_CONFIG.AUTH.REFRESH_TOKEN_KEY);
    
    if (!refreshToken) {
      console.warn('No refresh token available');
      return { success: false, message: 'No refresh token available' };
    }

    // Make sure we don't have a token verification failed flag set
    const tokenVerificationFailed = localStorage.getItem("token_verification_failed");
    if (tokenVerificationFailed === "true") {
      console.warn('Token verification previously failed, aborting refresh');
      return { success: false, message: 'Token verification previously failed' };
    }
    
    // Make the actual refresh request
    const response = await httpClient.post('/auth/refresh', { refreshToken });
    
    if (response?.token || response?.data?.token) {
      const newToken = response.token || response.data?.token;
      const newRefreshToken = response.refreshToken || response.data?.refreshToken;
      
      console.log('Token refresh successful, storing new token');
      
      // Store the new token
      localStorage.setItem(API_SERVICE_CONFIG.AUTH.TOKEN_KEY, newToken);
      
      // Clear any token verification failure flag
      localStorage.removeItem("token_verification_failed");
      
      // Update refresh token if a new one is provided
      if (newRefreshToken) {
        localStorage.setItem(API_SERVICE_CONFIG.AUTH.REFRESH_TOKEN_KEY, newRefreshToken);
      }
      
      return { 
        success: true, 
        data: { 
          token: newToken, 
          refreshToken: newRefreshToken 
        } 
      };
    } else {
      console.warn('No token in refresh response', response);
      return { success: false, message: 'No token in refresh response' };
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    
    // Check for specific error types that indicate the refresh token is invalid
    const isAuthError = 
      error.response?.status === 401 || 
      error.message?.includes('auth') ||
      error.message?.includes('token') ||
      error.message?.includes('expired') ||
      error.response?.data?.message?.includes('token') ||
      error.response?.data?.message?.includes('auth');
      
    if (isAuthError) {
      console.error('Auth error during token refresh, tokens are likely invalid');
      localStorage.setItem("token_verification_failed", "true");
    }
    
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Failed to refresh token',
      status: error.response?.status || 401,
      authError: isAuthError
    };
  }
};

/**
 * Check if user is currently authenticated with better error handling
 * @returns {boolean} - True if user has a stored token
 */
export const isAuthenticated = () => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem(API_SERVICE_CONFIG.AUTH.TOKEN_KEY);
    
    // Check for token verification failure flag
    const tokenFailed = localStorage.getItem("token_verification_failed");
    
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
    const token = localStorage.getItem(API_SERVICE_CONFIG.AUTH.TOKEN_KEY);
    
    // Check for token verification failure flag
    const tokenFailed = localStorage.getItem("token_verification_failed");
    
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
};

export default authService; 