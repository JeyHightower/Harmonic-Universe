/**
 * API Utility Functions
 * Helper functions for API requests
 */

import { getEndpoint, getApiEndpoint } from '../endpoints';

// Simple environment detection
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Simple function to get auth token from localStorage
 * @returns {string|null} The access token
 */
const getAccessToken = () => {
  try {
    return localStorage.getItem('accessToken');
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
};

/**
 * Base URL for API requests
 * @type {string}
 */
const API_BASE_URL = isProduction 
  ? process.env.REACT_APP_API_URL || '/api'
  : 'http://localhost:8000/api';

/**
 * Get authentication headers for API requests
 * @returns {Object} Headers with authentication token
 */
export const getAuthHeaders = async () => {
  const token = await getAccessToken();
  
  if (!token) {
    return {};
  }
  
  return {
    'Authorization': `Bearer ${token}`
  };
};

/**
 * Format URL for API requests
 * @param {string} url - URL to format
 * @returns {string} Formatted URL
 */
export const formatUrl = (url) => {
  if (url.startsWith('http')) {
    // External URL, return as is
    return url;
  }
  
  // Clean up slashes to avoid double slashes
  const baseUrl = API_BASE_URL.endsWith('/') 
    ? API_BASE_URL.slice(0, -1) 
    : API_BASE_URL;
    
  const path = url.startsWith('/') ? url : `/${url}`;
  
  return `${baseUrl}${path}`;
};

/**
 * Format query parameters for URL
 * @param {Object} params - Query parameters
 * @returns {string} Formatted query string
 */
export const formatQueryParams = (params = {}) => {
  if (!params || Object.keys(params).length === 0) {
    return '';
  }
  
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      // Handle arrays
      if (Array.isArray(value)) {
        return value
          .map(item => `${encodeURIComponent(key)}=${encodeURIComponent(item)}`)
          .join('&');
      }
      
      // Handle objects
      if (typeof value === 'object') {
        return `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`;
      }
      
      // Handle primitive values
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');
  
  return queryString ? `?${queryString}` : '';
};

/**
 * Extract data from different response formats
 * @param {Object} response - API response
 * @returns {any} Response data
 */
export const extractResponseData = (response) => {
  // Handle axios response format
  if (response && response.data !== undefined) {
    return response.data;
  }
  
  // Return the response itself if it doesn't follow axios format
  return response;
};

/**
 * Extract error data from different error formats
 * @param {Error} error - Error object
 * @returns {Object} Standardized error data
 */
export const extractErrorData = (error) => {
  // Default error structure
  const defaultError = {
    message: 'An unexpected error occurred',
    status: 500,
    data: null
  };
  
  // If not an error object, return default
  if (!error) {
    return defaultError;
  }
  
  // Handle axios error
  if (error.response) {
    // Server responded with a status code outside of 2xx range
    return {
      message: error.response.data?.message || 'Server error',
      status: error.response.status,
      data: error.response.data
    };
  }
  
  if (error.request) {
    // Request was made but no response received
    return {
      message: 'No response from server',
      status: 0,
      data: null
    };
  }
  
  // Something else caused the error
  return {
    message: error.message || defaultError.message,
    status: error.status || defaultError.status,
    data: error.data || defaultError.data
  };
};

/**
 * Convert file to base64 string
 * @param {File} file - File to convert
 * @returns {Promise<string>} Base64 string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = () => {
      const base64String = reader.result;
      resolve(base64String);
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
  });
};

/**
 * Check if a JWT token is expired
 * @param {string} token - JWT token to check
 * @returns {boolean} - True if token is expired or invalid
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    // Parse JWT token
    const base64Url = token.split('.')[1];
    if (!base64Url) return true;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const { exp } = JSON.parse(jsonPayload);
    if (!exp) return true;
    
    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime > exp;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

export const utilityApi = {
  getAuthHeaders,
  formatUrl,
  formatQueryParams,
  extractResponseData,
  extractErrorData,
  fileToBase64,
  getEndpoint,
  getApiEndpoint,
  isTokenExpired
};

export default utilityApi; 