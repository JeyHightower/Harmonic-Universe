/**
 * HTTP Client
 * Core client for making HTTP requests with configured defaults
 */

import axios from 'axios';
import { API_CONFIG, AUTH_CONFIG } from '../utils/config.mjs';
import { log, logError } from '../utils/logger.mjs';
import * as authServiceModule from './auth.service.mjs';
import { demoUserService } from './demo-user.service.mjs';
import { refreshToken, getToken, logout } from './auth.service.mjs';

// Debug helper for API operations
const logApiOperation = (operation, data = {}) => {
  log('api', operation, data);

  // Initialize debug object if not exists
  if (typeof window !== 'undefined' && !window.apiDebug) {
    window.apiDebug = {
      operations: [],
      errors: [],
      baseUrl: null,
    };
  }

  // Add operation to log
  if (typeof window !== 'undefined') {
    window.apiDebug.operations.push({
      time: new Date().toISOString(),
      operation,
      ...data,
    });
  }
};

// Determine if we need a CORS proxy for different environments
const shouldUseCorsProxy = () => {
  // In development, check if we're hitting CORS issues
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // Only use the proxy if specifically enabled to avoid unnecessary proxying
    const forceCorsProxy = localStorage.getItem('force_cors_proxy') === 'true';
    const useCorsProxy = localStorage.getItem('use_cors_proxy') === 'true';
    
    // For debugging authentication issues
    const useProxyForAuth = localStorage.getItem('use_proxy_for_auth') === 'true';
    
    return forceCorsProxy || useCorsProxy || useProxyForAuth;
  }
  return false;
};

// Get the appropriate CORS proxy URL if needed
const getCorsProxyUrl = (url) => {
  if (!shouldUseCorsProxy()) return url;
  
  // Don't add proxy for URLs that already have it
  if (url.includes('https://cors-anywhere.herokuapp.com/')) return url;
  
  // Determine which CORS proxy to use
  const preferredProxy = localStorage.getItem('cors_proxy_url');
  
  logApiOperation('cors-proxy', { url, preferredProxy });
  
  if (preferredProxy) {
    return `${preferredProxy}${url}`;
  }
  
  // Default to cors-anywhere
  return `https://cors-anywhere.herokuapp.com/${url}`;
};

// Determine the base URL based on environment with enhanced detection
const getBaseUrl = () => {
  logApiOperation('getBaseUrl-started');

  try {
    // Try environment variable first
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) {
      logApiOperation('getBaseUrl-env', { url: envUrl });
      return envUrl;
    }

    // Get information about current environment
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    const origin = window.location.origin;

    logApiOperation('getBaseUrl-environment', {
      hostname,
      protocol,
      port,
      origin,
    });

    // Handle production environments (including Render.com)
    if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
      // For production, use relative API URLs (same domain)
      logApiOperation('getBaseUrl-production', { url: '' });
      window.apiDebug.baseUrl = '';
      return '';
    }

    // Default for local development: use localhost:5001
    const localUrl = 'http://localhost:5001';
    logApiOperation('getBaseUrl-local', { url: localUrl });
    window.apiDebug.baseUrl = localUrl;
    return localUrl;
  } catch (error) {
    console.error('Error in getBaseUrl:', error);
    logApiOperation('getBaseUrl-error', {
      message: error.message,
      stack: error.stack,
    });

    // Add to errors collection
    if (window.apiDebug) {
      window.apiDebug.errors.push({
        time: new Date().toISOString(),
        operation: 'getBaseUrl',
        error: error.message,
        stack: error.stack,
      });
    }

    // Return empty string as fallback (same origin)
    return '';
  }
};

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Origin': typeof window !== 'undefined' ? window.location.origin : '',
  },
  withCredentials: true, // Important for CORS with credentials
  xsrfCookieName: 'csrf_token',
  xsrfHeaderName: 'X-CSRFToken',
});

// Log the base URL being used
logApiOperation('api-client-initialized', {
  baseURL: getBaseUrl(),
  config: {
    withCredentials: true,
    timeout: API_CONFIG.TIMEOUT
  }
});

// Simple in-memory cache for GET requests
const cache = new Map();

/**
 * Clear the entire request cache
 */
const clearCache = () => {
  cache.clear();
  logApiOperation('cache-cleared');
};

/**
 * Clear a specific cache entry by URL
 * @param {string} url - URL to clear from cache
 */
const clearCacheForUrl = (url) => {
  if (cache.has(url)) {
    cache.delete(url);
    logApiOperation('cache-cleared-url', { url });
  }
};

// Request interceptor for authentication
axiosInstance.interceptors.request.use(
  async (config) => {
    logApiOperation('request-interceptor', {
      url: config.url,
      method: config.method,
      headers: config.headers
    });

    // Add CORS proxy if needed
    if (config.url && shouldUseCorsProxy()) {
      config.url = getCorsProxyUrl(config.url);
      logApiOperation('request-proxied', { url: config.url });
    }

    // Add authorization header if token exists
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      logApiOperation('request-auth', { hasToken: true });
    }

    return config;
  },
  (error) => {
    logApiOperation('request-error', {
      error: error.message,
      stack: error.stack
    });
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    logApiOperation('response-success', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    logApiOperation('response-error', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      try {
        // Attempt to refresh the token
        const newToken = await refreshToken();
        if (newToken) {
          // Retry the original request with new token
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(error.config);
        }
      } catch (refreshError) {
        logApiOperation('token-refresh-failed', {
          error: refreshError.message
        });
        // If refresh fails, logout the user
        logout();
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Format a URL to include the API base if not already included
 * @param {string} url - URL to request
 * @returns {string} - Formatted URL
 */
const formatUrl = (url) => {
  // Log the URL for debugging
  console.log('Original URL:', url);

  // If URL already starts with http:// or https://, return it as is
  if (url.startsWith('http')) {
    console.log('URL starts with http, using as is:', url);
    return url;
  }

  // If URL already includes the API_PREFIX
  const hasApiPrefix = url.startsWith(API_CONFIG.API_PREFIX);
  
  // If URL does not start with a slash, add one
  if (!url.startsWith('/') && !hasApiPrefix) {
    url = '/' + url;
  }
  
  // Ensure trailing slash to prevent redirects
  if (!url.endsWith('/')) {
    url = url + '/';
  }
  
  // If the URL already has the API prefix, make sure we don't duplicate it
  // The baseURL should not have /api at the end, but just in case
  const baseUrl = API_CONFIG.BASE_URL.endsWith('/api') 
    ? API_CONFIG.BASE_URL 
    : API_CONFIG.BASE_URL;
    
  const formattedUrl = hasApiPrefix ? url : url.startsWith('/api') ? url : url;
  console.log(`Formatted URL: ${formattedUrl}`);
  return formattedUrl;
};

/**
 * Check if a response is cached and not expired
 * @param {string} url - Request URL
 * @param {object} options - Request options
 * @returns {object|null} - Cached response or null
 */
const getCachedResponse = (url, options) => {
  // Skip cache if disabled globally or in options
  if (!API_CONFIG.CACHE.ENABLED || options.cache === false) {
    return null;
  }
  
  const cached = cache.get(url);
  if (cached) {
    const now = Date.now();
    if (now - cached.timestamp < API_CONFIG.CACHE.DURATION) {
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
 * Cache a response
 * @param {string} url - Request URL
 * @param {object} data - Response data
 * @param {object} options - Request options
 */
const cacheResponse = (url, data, options) => {
  // Skip caching if disabled globally or in options
  if (!API_CONFIG.CACHE.ENABLED || options.cache === false) {
    return;
  }
  
  cache.set(url, {
    data,
    timestamp: Date.now()
  });
  log('api', 'Cached response', { url });
};

/**
 * Handle retry logic for rate limited requests
 * @param {Function} requestFn - The request function to call
 * @param {object} options - Request options
 * @returns {Promise<any>} - Response data
 */
const withRetry = async (requestFn, options = {}) => {
  const maxRetries = options.maxRetries || API_CONFIG.RETRY.MAX_RETRIES;
  const initialRetryDelay = options.retryDelay || API_CONFIG.RETRY.RETRY_DELAY;
  const retryStatuses = options.retryStatuses || API_CONFIG.RETRY.RETRY_STATUSES;
  const backoffFactor = API_CONFIG.RETRY.BACKOFF_FACTOR || 2;
  const rateLimitConfig = API_CONFIG.RETRY.RATE_LIMIT;
  
  let lastError;
  let attempts = 0;
  
  while (attempts <= maxRetries) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Only retry on specific status codes
      if (
        error.response &&
        retryStatuses.includes(error.response.status) &&
        attempts < maxRetries
      ) {
        // Calculate base delay with exponential backoff and jitter
        let delay = initialRetryDelay * Math.pow(backoffFactor, attempts) + (Math.random() * 500);
        
        // Special handling for rate limiting (429)
        if (error.response.status === 429) {
          log('api', 'Rate limit (429) detected, applying special handling');
          
          if (rateLimitConfig?.RESPECT_RETRY_AFTER) {
            // Try to get Retry-After header
            const retryAfter = error.response.headers?.['retry-after'];
            if (retryAfter) {
              // Retry-After can be seconds or a date
              let retryAfterMs;
              if (/^\d+$/.test(retryAfter)) {
                // It's seconds
                retryAfterMs = parseInt(retryAfter) * 1000;
              } else {
                // It's a date
                const retryDate = new Date(retryAfter);
                retryAfterMs = retryDate.getTime() - Date.now();
              }
              
              if (retryAfterMs > 0) {
                log('api', `Using server's Retry-After value: ${retryAfterMs}ms`);
                delay = retryAfterMs;
              }
            } else {
              // No Retry-After, use default
              delay = rateLimitConfig.DEFAULT_RETRY_AFTER || 5000;
              log('api', `No Retry-After header, using default delay: ${delay}ms`);
            }
          }
          
          // Add additional delay for rate limiting
          if (rateLimitConfig?.ADDITIONAL_DELAY) {
            delay += rateLimitConfig.ADDITIONAL_DELAY;
          }
        }
        
        log('api', `Request failed with status ${error.response.status}. Retrying in ${Math.round(delay)}ms (${attempts + 1}/${maxRetries})`, {
          status: error.response.status,
          url: error.config.url,
          attempt: attempts + 1,
          delay: Math.round(delay)
        });
        
        // Wait for the calculated delay
        await new Promise(resolve => setTimeout(resolve, delay));
        attempts++;
        continue;
      }
      
      // If we're not retrying, rethrow the error
      throw error;
    }
  }
  
  // If we've exhausted our retries, throw the last error
  throw lastError;
};

/**
 * HTTP GET request with caching
 * @param {string} url - The URL to request
 * @param {Object} [config] - Axios request config
 * @returns {Promise} - The response promise
 */
const get = async (url, config = {}) => {
  logApiOperation('get-request', { url, config });

  // Check cache first
  if (cache.has(url)) {
    logApiOperation('cache-hit', { url });
    return cache.get(url);
  }

  try {
    const response = await axiosInstance.get(url, config);
    // Cache successful GET responses
    cache.set(url, response);
    return response;
  } catch (error) {
    logApiOperation('get-error', {
      url,
      error: error.message
    });
    throw error;
  }
};

/**
 * HTTP POST request
 * @param {string} url - The URL to request
 * @param {Object} data - The data to send
 * @param {Object} [config] - Axios request config
 * @returns {Promise} - The response promise
 */
const post = async (url, data, config = {}) => {
  logApiOperation('post-request', { url, data, config });

  try {
    const response = await axiosInstance.post(url, data, config);
    // Clear cache for this URL after successful POST
    clearCacheForUrl(url);
    return response;
  } catch (error) {
    logApiOperation('post-error', {
      url,
      error: error.message
    });
    throw error;
  }
};

/**
 * HTTP PUT request
 * @param {string} url - The URL to request
 * @param {Object} data - The data to send
 * @param {Object} [config] - Axios request config
 * @returns {Promise} - The response promise
 */
const put = async (url, data, config = {}) => {
  logApiOperation('put-request', { url, data, config });

  try {
    const response = await axiosInstance.put(url, data, config);
    // Clear cache for this URL after successful PUT
    clearCacheForUrl(url);
    return response;
  } catch (error) {
    logApiOperation('put-error', {
      url,
      error: error.message
    });
    throw error;
  }
};

/**
 * HTTP DELETE request
 * @param {string} url - The URL to request
 * @param {Object} [config] - Axios request config
 * @returns {Promise} - The response promise
 */
const del = async (url, config = {}) => {
  logApiOperation('delete-request', { url, config });

  try {
    const response = await axiosInstance.delete(url, config);
    // Clear cache for this URL after successful DELETE
    clearCacheForUrl(url);
    return response;
  } catch (error) {
    logApiOperation('delete-error', {
      url,
      error: error.message
    });
    throw error;
  }
};

/**
 * Add authorization header to a request config
 * @param {Object} config - The request config
 * @returns {Object} - The updated config
 */
const addAuthHeader = (config = {}) => {
  const token = getToken();
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`
    };
  }
  return config;
};

/**
 * HTTP Client with methods for different HTTP verbs
 */
export const httpClient = {
  /**
   * Send a GET request
   * @param {string} url - URL to request
   * @param {object} options - Request options
   * @returns {Promise<any>} - Response data
   */
  get: async (url, options = {}) => {
    const formattedUrl = formatUrl(url);
    
    // Check cache for GET requests
    const cachedResponse = getCachedResponse(formattedUrl, options);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Make the request with retry logic for cacheable GET requests
    const response = await withRetry(
      () => axiosInstance.get(formattedUrl, options),
      options
    );
    const data = response.data;
    
    // Cache successful response
    cacheResponse(formattedUrl, data, options);
    
    return data;
  },
  
  /**
   * Send a POST request
   * @param {string} url - URL to request
   * @param {object} data - Request payload
   * @param {object} options - Request options
   * @returns {Promise<any>} - Response data
   */
  post: async (url, data = {}, options = {}) => {
    const formattedUrl = formatUrl(url);
    
    // Clear cache for this URL if it exists
    clearCacheForUrl(formattedUrl);
    
    // Special handling for auth endpoints
    const isAuthEndpoint = formattedUrl.includes('/auth/');
    
    if (isAuthEndpoint && formattedUrl.includes('/logout')) {
      // Handle logout specially - don't retry on 429
      try {
        const response = await axiosInstance.post(formattedUrl, data, options);
        return response.data;
      } catch (error) {
        if (error.response && error.response.status === 429) {
          log('api', 'Logout rate limited (429) - treating as successful', { url: formattedUrl });
          return { success: true, message: "Logged out successfully (client-side only)" };
        }
        throw error;
      }
    }
    
    // Make the request with retry logic
    const response = await withRetry(
      () => axiosInstance.post(formattedUrl, data, options),
      options
    );
    
    return response.data;
  },
  
  /**
   * Send a PUT request
   * @param {string} url - URL to request
   * @param {object} data - Request payload
   * @param {object} options - Request options
   * @returns {Promise<any>} - Response data
   */
  put: async (url, data = {}, options = {}) => {
    const formattedUrl = formatUrl(url);
    
    // Clear cache for this URL if it exists
    clearCacheForUrl(formattedUrl);
    
    // Make the request with retry logic
    const response = await withRetry(
      () => axiosInstance.put(formattedUrl, data, options),
      options
    );
    
    return response.data;
  },
  
  /**
   * Send a PATCH request
   * @param {string} url - URL to request
   * @param {object} data - Request payload
   * @param {object} options - Request options
   * @returns {Promise<any>} - Response data
   */
  patch: async (url, data = {}, options = {}) => {
    const formattedUrl = formatUrl(url);
    
    // Clear cache for this URL if it exists
    clearCacheForUrl(formattedUrl);
    
    // Make the request with retry logic
    const response = await withRetry(
      () => axiosInstance.patch(formattedUrl, data, options),
      options
    );
    
    return response.data;
  },
  
  /**
   * Send a DELETE request
   * @param {string} url - URL to request
   * @param {object} options - Request options
   * @returns {Promise<any>} - Response data
   */
  delete: async (url, options = {}) => {
    const formattedUrl = formatUrl(url);
    
    // Clear cache for this URL if it exists
    clearCacheForUrl(formattedUrl);
    
    // Make the request with retry logic
    const response = await withRetry(
      () => axiosInstance.delete(formattedUrl, options),
      options
    );
    
    return response.data;
  },
  
  /**
   * Upload file(s)
   * @param {string} url - Upload URL
   * @param {FormData} formData - Form data with files
   * @param {function} onProgress - Progress callback
   * @param {object} options - Request options
   * @returns {Promise<any>} - Response data
   */
  upload: async (url, formData, onProgress = null, options = {}) => {
    const formattedUrl = formatUrl(url);
    
    const uploadOptions = {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'multipart/form-data'
      }
    };
    
    if (onProgress) {
      uploadOptions.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      };
    }
    
    const response = await axiosInstance.post(formattedUrl, formData, uploadOptions);
    return response.data;
  },
  
  /**
   * Download a file
   * @param {string} url - File URL
   * @param {object} options - Request options
   * @returns {Promise<Blob>} - File blob
   */
  download: async (url, options = {}) => {
    const formattedUrl = formatUrl(url);
    
    const downloadOptions = {
      ...options,
      responseType: 'blob'
    };
    
    const response = await axiosInstance.get(formattedUrl, downloadOptions);
    return response.data;
  },
  
  // Utility methods
  clearCache,
  clearCacheForUrl,
  formatUrl,
  axiosInstance
};

export {
  axiosInstance,
  get,
  post,
  put,
  del,
  clearCache,
  clearCacheForUrl,
  addAuthHeader,
  shouldUseCorsProxy,
  getCorsProxyUrl,
  logApiOperation
};

export default httpClient; 