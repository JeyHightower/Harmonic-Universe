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
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} - Login response with auth token
 */
export const login = async (email, password) => {
  try {
    const response = await httpClient.post(authEndpoints.login, { email, password });
    
    // Handle successful login
    if (response.token) {
      // Store token in localStorage
      localStorage.setItem(API_SERVICE_CONFIG.AUTH.TOKEN_KEY, response.token);
      
      // Log successful login
      Logger.log('auth', 'User logged in successfully', { email });
      
      return responseHandler.handleSuccess(response);
    }
    
    return responseHandler.handleSuccess(response);
  } catch (error) {
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
    return responseHandler.handleError(error);
  }
};

/**
 * Log in as a demo user
 * @returns {Promise<object>} - Demo login response
 */
export const demoLogin = async () => {
  try {
    const response = await httpClient.post(authEndpoints.demoLogin);
    
    // Handle successful demo login
    if (response.token) {
      localStorage.setItem(API_SERVICE_CONFIG.AUTH.TOKEN_KEY, response.token);
      Logger.log('auth', 'Demo user logged in successfully');
    }
    
    return responseHandler.handleSuccess(response);
  } catch (error) {
    return responseHandler.handleError(error);
  }
};

/**
 * Log out current user
 * @returns {Promise<object>} - Logout response
 */
export const logout = async () => {
  try {
    // Call logout endpoint
    const response = await httpClient.post(authEndpoints.logout);
    
    // Clear auth token regardless of response
    localStorage.removeItem(API_SERVICE_CONFIG.AUTH.TOKEN_KEY);
    
    // Clear any cached data
    httpClient.clearCache();
    
    Logger.log('auth', 'User logged out successfully');
    return responseHandler.handleSuccess(response);
  } catch (error) {
    // Still remove token even if logout fails
    localStorage.removeItem(API_SERVICE_CONFIG.AUTH.TOKEN_KEY);
    return responseHandler.handleError(error);
  }
};

/**
 * Validate current auth token
 * @returns {Promise<object>} - Validation response
 */
export const validateToken = async () => {
  try {
    const token = localStorage.getItem(API_SERVICE_CONFIG.AUTH.TOKEN_KEY);
    
    if (!token) {
      return responseHandler.handleError(new Error('No auth token found'));
    }
    
    const response = await httpClient.post(authEndpoints.validate);
    return responseHandler.handleSuccess(response);
  } catch (error) {
    return responseHandler.handleError(error);
  }
};

/**
 * Refresh the current auth token
 * @returns {Promise<object>} - Refresh response with new token
 */
export const refreshToken = async () => {
  try {
    const response = await httpClient.post(authEndpoints.refresh);
    
    if (response.token) {
      localStorage.setItem(API_SERVICE_CONFIG.AUTH.TOKEN_KEY, response.token);
      Logger.log('auth', 'Auth token refreshed successfully');
    }
    
    return responseHandler.handleSuccess(response);
  } catch (error) {
    return responseHandler.handleError(error);
  }
};

/**
 * Check if user is currently authenticated
 * @returns {boolean} - True if user has a stored token
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem(API_SERVICE_CONFIG.AUTH.TOKEN_KEY);
};

/**
 * Get the current auth token
 * @returns {string|null} - Current auth token or null
 */
export const getToken = () => {
  return localStorage.getItem(API_SERVICE_CONFIG.AUTH.TOKEN_KEY);
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