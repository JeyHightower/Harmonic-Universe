/**
 * HTTP Client
 * Core client for making HTTP requests with configured defaults
 */

import axios from 'axios';
import { API_SERVICE_CONFIG } from './config';
import { log, logError } from '../utils/logger';
import * as authServiceModule from './auth.service.mjs';
import { demoUserService } from './demo-user.service.mjs';
import { AUTH_CONFIG } from '../utils/config.mjs';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_SERVICE_CONFIG.BASE_URL,
  timeout: API_SERVICE_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important for CORS with credentials
});

// Log the base URL being used
console.log(`API client initialized with baseURL: ${API_SERVICE_CONFIG.BASE_URL}`);
console.log('Axios config:', {
  withCredentials: true,
  baseURL: API_SERVICE_CONFIG.BASE_URL,
  timeout: API_SERVICE_CONFIG.TIMEOUT
});

// Simple in-memory cache for GET requests
const cache = new Map();

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
 * @returns {object} - Updated config
 */
const addAuthHeader = (config) => {
  const token = localStorage.getItem(API_SERVICE_CONFIG.AUTH.TOKEN_KEY);
  
  if (token) {
    try {
      // Log token details for debugging (safely)
      const tokenStart = token.substring(0, 5);
      const tokenEnd = token.length > 10 ? token.substring(token.length - 5) : '...';
      log('api', 'Adding auth token', { tokenFormat: `${tokenStart}...${tokenEnd}`, length: token.length });
      
      // Add proper Authorization header
      config.headers['Authorization'] = `Bearer ${token}`;
      
      // Ensure Content-Type is set correctly
      if (!config.headers['Content-Type'] && !config.headers['content-type']) {
        config.headers['Content-Type'] = 'application/json';
      }
    } catch (err) {
      log('api', 'Error adding auth token', { error: err.message });
    }
  } else {
    log('api', 'No auth token available');
  }
  
  return config;
};

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Log request
    log('api', 'Sending request', {
      method: config.method?.toUpperCase() || 'Unknown method',
      url: config.url,
      baseURL: config.baseURL,
    });

    // Add auth token if available
    return addAuthHeader(config);
  },
  (error) => {
    log('api', 'Request failed', { error: error.message });
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Successful responses pass through
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is a network error, don't attempt to refresh
    if (!error.response) {
      console.error('Network error occurred:', error.message);
      return Promise.reject(error);
    }
    
    // Log the error status
    console.log(`HTTP Error: ${error.response.status} ${error.response.statusText}`);
    
    // Handle rate limiting
    if (error.response.status === 429) {
      console.warn('Rate limit hit, backing off');
      // Wait for the retry-after header value or default to 2 seconds
      const retryAfter = error.response.headers['retry-after'] || 2;
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return axiosInstance(originalRequest);
    }
    
    // Only attempt token refresh for 401 errors and only if not already retrying
    if (error.response.status === 401 && !originalRequest._retry) {
      console.log('Unauthorized (401) error detected, attempting token refresh');
      
      try {
        // Use the enhanced refreshTokenAndRetry function
        return await refreshTokenAndRetry(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError.message);
        
        // Forward the original error with additional context
        const enhancedError = new Error('Authentication error after failed token refresh');
        enhancedError.originalError = error;
        enhancedError.refreshError = refreshError;
        return Promise.reject(enhancedError);
      }
    }
    
    // For all other errors, pass them through
    return Promise.reject(error);
  }
);

/**
 * Refresh the token and retry the original request
 * @param {Object} originalRequest - The original request configuration
 * @returns {Promise<Object>} - The response from the retried request
 */
export async function refreshTokenAndRetry(originalRequest) {
  // Check if we already have a refresh token
  const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    console.error('No refresh token available for token refresh');
    authServiceModule.clearAuthData();
    throw new Error('Authentication failed: No refresh token available');
  }

  // Prevent multiple retry attempts for the same request
  if (originalRequest._retry) {
    console.warn('Request already retried once, not attempting again');
    throw new Error('Authentication failed: Token refresh failed');
  }
  
  // Mark this request as having been retried
  originalRequest._retry = true;
  
  console.log('Attempting to refresh token and retry request');
  
  // Set up a timeout for the token refresh process
  const tokenRefreshTimeout = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Token refresh timed out after 10 seconds'));
    }, 10000);
  });
  
  try {
    // Race the token refresh against the timeout
    const refreshResult = await Promise.race([
      authServiceModule.refreshToken(),
      tokenRefreshTimeout
    ]);
    
    console.log('Token refresh completed, checking result');
    
    // Validate refresh result and ensure it contains a new token
    if (!refreshResult) {
      throw new Error('Token refresh failed: No response received');
    }
    
    if (!refreshResult.success) {
      throw new Error(`Token refresh failed: ${refreshResult.message || 'Unknown error'}`);
    }
    
    if (!refreshResult.token) {
      throw new Error('Token refresh failed: No token in response');
    }
    
    // Log the successful token refresh
    console.log('Token refreshed successfully, updating request and retrying');
    
    // Update the Authorization header with the new token
    const newToken = refreshResult.token;
    originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
    
    // Retry the original request with the new token
    return axiosInstance(originalRequest);
  } catch (error) {
    console.error('Error during token refresh or retry:', error);
    
    // Clear auth data to force a re-login
    authServiceModule.clearAuthData();
    
    // Notify the app about the authentication failure
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:refreshFailed', { 
        detail: { error: error.message } 
      }));
    }
    
    throw error;
  }
}

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
  const hasApiPrefix = url.startsWith(API_SERVICE_CONFIG.API_PREFIX);
  
  // If URL does not start with a slash, add one
  if (!url.startsWith('/') && !hasApiPrefix) {
    url = '/' + url;
  }
  
  // If the URL already has the API prefix, make sure we don't duplicate it
  // The baseURL should not have /api at the end, but just in case
  const baseUrl = API_SERVICE_CONFIG.BASE_URL.endsWith('/api') 
    ? API_SERVICE_CONFIG.BASE_URL 
    : API_SERVICE_CONFIG.BASE_URL;
    
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
  if (!API_SERVICE_CONFIG.CACHE.ENABLED || options.cache === false) {
    return null;
  }
  
  const cached = cache.get(url);
  if (cached) {
    const now = Date.now();
    if (now - cached.timestamp < API_SERVICE_CONFIG.CACHE.DURATION) {
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
  if (!API_SERVICE_CONFIG.CACHE.ENABLED || options.cache === false) {
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
  const maxRetries = options.maxRetries || API_SERVICE_CONFIG.RETRY.MAX_RETRIES;
  const initialRetryDelay = options.retryDelay || API_SERVICE_CONFIG.RETRY.RETRY_DELAY;
  const retryStatuses = options.retryStatuses || API_SERVICE_CONFIG.RETRY.RETRY_STATUSES;
  const backoffFactor = API_SERVICE_CONFIG.RETRY.BACKOFF_FACTOR || 2;
  const rateLimitConfig = API_SERVICE_CONFIG.RETRY.RATE_LIMIT;
  
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

export default httpClient; 