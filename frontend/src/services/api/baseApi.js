/**
 * Base API Module
 * Provides core HTTP request functionality with interceptors for auth, caching, and error handling
 */

import axios from 'axios';
import { utilityApi } from './utilityApi';
import { log } from '../../utils/logger';

// Create axios instance with default config
const axiosInstance = axios.create({
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Simple in-memory cache for GET requests
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Clear the entire request cache
 */
const clearCache = () => {
  cache.clear();
  log('api', 'Cache cleared');
};

/**
 * Clear a specific cache entry by URL
 * @param {string} url - URL to clear from cache
 */
const clearCacheForUrl = (url) => {
  if (cache.has(url)) {
    cache.delete(url);
    log('api', 'Cache cleared for URL', { url });
  }
};

/**
 * Add authorization header to request
 * @param {object} config - Axios request config
 * @param {object} options - Request options
 * @returns {object} - Updated config
 */
const addAuthHeader = (config, options) => {
  // Skip adding auth header if specified in options
  if (options.skipAuth) {
    return config;
  }

  const token = localStorage.getItem('auth_token');
  
  // Skip if no token and not required to check
  if (!token && options.skipTokenCheck) {
    return config;
  }
  
  // Check if token exists and is valid
  if (token && !utilityApi.isTokenExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (!options.skipTokenCheck) {
    // Token is required but missing or expired
    throw new Error('Authentication required');
  }
  
  return config;
};

/**
 * Get cached response if available and not expired
 * @param {string} url - Request URL
 * @param {object} options - Request options
 * @returns {object|null} - Cached response or null
 */
const getCachedResponse = (url, options) => {
  // Skip cache if disabled in options
  if (options.cache === false) {
    return null;
  }
  
  const cached = cache.get(url);
  if (cached) {
    const now = Date.now();
    if (now - cached.timestamp < CACHE_DURATION) {
      log('api', 'Cache hit', { url });
      return cached.data;
    } else {
      // Expired cache entry
      cache.delete(url);
    }
  }
  return null;
};

/**
 * Cache response data
 * @param {string} url - Request URL
 * @param {object} data - Response data
 * @param {object} options - Request options
 */
const cacheResponse = (url, data, options) => {
  // Skip caching if disabled in options
  if (options.cache === false) {
    return;
  }
  
  cache.set(url, {
    data,
    timestamp: Date.now()
  });
  log('api', 'Cached response', { url });
};

/**
 * Process API response
 * @param {object} response - Axios response
 * @returns {object} - Processed response data
 */
const processResponse = (response) => {
  return response.data;
};

/**
 * Handle API errors
 * @param {Error} error - Error object
 * @returns {object} - Error response
 */
const handleError = (error) => {
  // Log error details
  const logData = {
    message: error.message,
    status: error.response?.status,
    url: error.config?.url,
    method: error.config?.method?.toUpperCase()
  };
  
  log('api', 'API Error', logData);
  
  // Axios error with response
  if (error.response) {
    // Return API error response if available
    if (error.response.data) {
      return {
        success: false,
        message: error.response.data.message || 'API Error',
        status: error.response.status,
        data: error.response.data
      };
    }
    
    // Generic error with status code
    return {
      success: false,
      message: `API Error: ${error.response.status}`,
      status: error.response.status
    };
  }
  
  // Network error (no response)
  if (error.request) {
    return {
      success: false,
      message: 'Network Error: No response received',
      isNetworkError: true
    };
  }
  
  // Other errors
  return {
    success: false,
    message: error.message,
    error
  };
};

/**
 * Base API service for making HTTP requests
 */
export const baseApi = {
  /**
   * Send GET request
   * @param {string} url - Request URL
   * @param {object} options - Request options
   * @returns {Promise<object>} - Response data
   */
  get: async (url, options = {}) => {
    try {
      url = utilityApi.formatUrl(url);
      
      // Check cache for GET requests
      const cachedResponse = getCachedResponse(url, options);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      const config = addAuthHeader({
        method: 'GET',
        url,
        params: options.params
      }, options);
      
      const response = await axiosInstance(config);
      const data = processResponse(response);
      
      // Cache successful responses
      cacheResponse(url, data, options);
      
      return data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  /**
   * Send POST request
   * @param {string} url - Request URL
   * @param {object} data - Request payload
   * @param {object} options - Request options
   * @returns {Promise<object>} - Response data
   */
  post: async (url, data = {}, options = {}) => {
    try {
      url = utilityApi.formatUrl(url);
      
      // Clear cache for this URL if it exists
      clearCacheForUrl(url);
      
      const config = addAuthHeader({
        method: 'POST',
        url,
        data
      }, options);
      
      const response = await axiosInstance(config);
      return processResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },
  
  /**
   * Send PUT request
   * @param {string} url - Request URL
   * @param {object} data - Request payload
   * @param {object} options - Request options
   * @returns {Promise<object>} - Response data
   */
  put: async (url, data = {}, options = {}) => {
    try {
      url = utilityApi.formatUrl(url);
      
      // Clear cache for this URL if it exists
      clearCacheForUrl(url);
      
      const config = addAuthHeader({
        method: 'PUT',
        url,
        data
      }, options);
      
      const response = await axiosInstance(config);
      return processResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },
  
  /**
   * Send PATCH request
   * @param {string} url - Request URL
   * @param {object} data - Request payload
   * @param {object} options - Request options
   * @returns {Promise<object>} - Response data
   */
  patch: async (url, data = {}, options = {}) => {
    try {
      url = utilityApi.formatUrl(url);
      
      // Clear cache for this URL if it exists
      clearCacheForUrl(url);
      
      const config = addAuthHeader({
        method: 'PATCH',
        url,
        data
      }, options);
      
      const response = await axiosInstance(config);
      return processResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },
  
  /**
   * Send DELETE request
   * @param {string} url - Request URL
   * @param {object} options - Request options
   * @returns {Promise<object>} - Response data
   */
  delete: async (url, options = {}) => {
    try {
      url = utilityApi.formatUrl(url);
      
      // Clear cache for this URL if it exists
      clearCacheForUrl(url);
      
      const config = addAuthHeader({
        method: 'DELETE',
        url,
        params: options.params
      }, options);
      
      const response = await axiosInstance(config);
      return processResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },
  
  /**
   * Upload file(s)
   * @param {string} url - Upload URL
   * @param {FormData} formData - Form data with files
   * @param {function} onProgress - Progress callback
   * @param {object} options - Request options
   * @returns {Promise<object>} - Response data
   */
  upload: async (url, formData, onProgress = null, options = {}) => {
    try {
      url = utilityApi.formatUrl(url);
      
      const config = addAuthHeader({
        method: 'POST',
        url,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: onProgress ? (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        } : undefined
      }, options);
      
      const response = await axiosInstance(config);
      return processResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },
  
  /**
   * Download a file
   * @param {string} url - File URL
   * @param {object} options - Request options
   * @returns {Promise<Blob>} - File blob
   */
  download: async (url, options = {}) => {
    try {
      url = utilityApi.formatUrl(url);
      
      const config = addAuthHeader({
        method: 'GET',
        url,
        responseType: 'blob',
        params: options.params
      }, options);
      
      const response = await axiosInstance(config);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  /**
   * Clear entire request cache
   */
  clearCache,
  
  /**
   * Clear cache for specific URL
   * @param {string} url - URL to clear from cache
   */
  clearCacheForUrl,
  
  /**
   * Get the axios instance for advanced usage
   * @returns {object} - Axios instance
   */
  getAxiosInstance: () => axiosInstance
};

// Export the baseApi module
export default baseApi; 