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
 * Handle demo login (no server interaction)
 */
export async function demoLogin() {
  try {
    // Create a demo token with timestamp to make it unique
    const timestamp = Date.now();
    const demoToken = `demo-token-${timestamp}`;
    
    // Store the demo token in localStorage
    localStorage.setItem(TOKEN_KEY, demoToken);
    
    // Create a demo user
    const demoUser = {
      id: 'demo-user',
      username: 'demouser',
      email: 'demo@example.com',
      roles: ['user'],
      demo: true
    };
    
    // Store user data
    localStorage.setItem(USER_KEY, JSON.stringify(demoUser));
    
    // Clear any verification failure flags
    localStorage.removeItem(TOKEN_VERIFICATION_FAILED);
    
    // Setup auth headers for future requests
    httpClient.defaults.headers.common['Authorization'] = `Bearer ${demoToken}`;
    
    console.log('Demo login successful');
    return {
      success: true,
      token: demoToken,
      user: demoUser,
      message: 'Demo login successful'
    };
  } catch (error) {
    console.error('Demo login error:', error);
    return { 
      success: false, 
      message: 'Error during demo login'
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
  try {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    // Use the correct endpoint from authEndpoints
    const refreshEndpoint = authEndpoints.refresh;
    console.log('Using refresh endpoint:', refreshEndpoint);
    
    // Get the current token for backup
    const currentToken = localStorage.getItem(TOKEN_KEY);
    
    // Send refresh request with refresh token in body and current access token in header
    const response = await httpClient.post(
      refreshEndpoint,
      { refresh_token: refreshToken },
      {
        headers: {
          'Authorization': currentToken ? `Bearer ${currentToken}` : undefined,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );
    
    // Extract token from response - handle different response formats
    const tokenData = response.data || response;
    const newToken = tokenData.token || tokenData.access_token;
    const newRefreshToken = tokenData.refresh_token;
    
    // Handle successful refresh
    if (newToken) {
      console.log('Token refreshed successfully');
      
      // Store new access token
      localStorage.setItem(TOKEN_KEY, newToken);
      
      // Store new refresh token if provided
      if (newRefreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      }
      
      // Update user data if provided
      if (tokenData.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(tokenData.user));
      }
      
      // Clear any verification failure flags
      localStorage.removeItem(TOKEN_VERIFICATION_FAILED);
      
      // Return the new token
      return newToken;
    } else {
      console.error('No token in refresh response:', tokenData);
      throw new Error('Invalid refresh response: No token returned');
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    
    // Check if we should clear auth data
    const shouldClearAuth = 
      error.response?.status === 401 || // Unauthorized
      error.response?.status === 403 || // Forbidden
      error.message?.includes('No refresh token available') ||
      error.message?.includes('Invalid refresh');
    
    if (shouldClearAuth) {
      console.log('Clearing auth data due to refresh failure');
      // Clear auth data if refresh failed due to auth issues
      clearAuthData();
    }
    
    throw error;
  }
}

/**
 * Clear all authentication data from storage
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
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
          timeout: 5000 // 5 second timeout for faster failure
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
            message: 'Using client-side validation due to network error' 
          };
        } catch (e) {
          console.error('Client-side validation failed:', e);
        }
      }
      
      // If server returns 401, token is definitely invalid
      if (validationError.response && validationError.response.status === 401) {
        // Try to refresh the token
        try {
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
    
    return { valid: false, message: error.message, isNetworkError: error.message?.includes('Network Error') };
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