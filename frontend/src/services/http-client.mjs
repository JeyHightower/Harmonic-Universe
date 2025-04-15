/**
 * HTTP Client
 * Core client for making HTTP requests with configured defaults
 */

import axios from 'axios';
import { API_SERVICE_CONFIG } from './config';

// Import auth service - fixing missing import
import authService from './auth.service';

/**
 * Safe logging function that won't throw errors
 */
const log = (category, message, data = {}) => {
  try {
    if (!import.meta.env.PROD) {
      console.log(`[${category.toUpperCase()}] ${message}`, data || '');
    }
  } catch (error) {
    // Fallback if there's any issue with logging
    console.log(`[API] ${message}`);
  }
};

/**
 * Safe error logging function
 */
const logError = (message, error) => {
  try {
    console.error(`[API ERROR] ${message}`, error);
  } catch (logError) {
    // Ultra-safe fallback
    console.error(message);
  }
};

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
      config.headers.Authorization = `${API_SERVICE_CONFIG.AUTH.TOKEN_TYPE} ${token}`;
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

// Configure response interceptor for handling auth errors and refreshing tokens
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Don't retry if we've already tried to refresh
    if (originalRequest._retry) {
      console.error('Request already retried once, failing:', originalRequest.url);
      return Promise.reject(error);
    }
    
    // Only handle 401 errors for token refresh
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Check if this is a token refresh attempt that failed
      if (originalRequest.url.includes('/auth/token/refresh') || 
          originalRequest.url.includes('/auth/token/validate')) {
        // Clear auth data if token refresh fails
        console.error('Auth error during token refresh or validation, signing out');
        authService.clearAuthData();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:signout'));
        }
        return Promise.reject(error);
      }
      
      try {
        console.log('Attempting token refresh due to 401 response');
        originalRequest._retry = true;
        
        // Setup timeout for token refresh
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Token refresh timeout')), 5000);
        });
        
        // Attempt to refresh the token
        const refreshPromise = refreshTokenAndRetry();
        const result = await Promise.race([refreshPromise, timeoutPromise]);
        
        // Update auth header with new token
        if (result && result.token) {
          originalRequest.headers['Authorization'] = `Bearer ${result.token}`;
          console.log('Token refreshed successfully, retrying original request');
          return axiosInstance(originalRequest);
        } else {
          console.error('No token received after refresh attempt');
          throw new Error('Token refresh failed - no token received');
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        // Clear auth data and notify the app
        authService.clearAuthData();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:signout'));
        }
        return Promise.reject(error);
      }
    }
    
    // Handle CORS errors
    if (error.message && error.message.includes('Network Error')) {
      console.error('Network error (possibly CORS):', error);
      console.error('Request details:', {
        method: error.config?.method,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        withCredentials: error.config?.withCredentials,
        headers: error.config?.headers
      });
      return Promise.reject(new Error('Network error: API may be unavailable or CORS not configured properly. Check console for details.'));
    }
    
    // Pass through other errors
    return Promise.reject(error);
  }
);

// Function to refresh the token
async function refreshTokenAndRetry() {
  console.log('Refreshing token...');
  try {
    // Get current token from storage
    const token = localStorage.getItem('token') || '';
    
    if (!token) {
      console.error('No token found in storage to refresh');
      throw new Error('No token available to refresh');
    }
    
    // Use authService directly instead of creating a new axios instance
    const refreshResult = await authService.refreshToken();
    
    if (refreshResult && refreshResult.success && refreshResult.data && refreshResult.data.token) {
      console.log('Token refreshed successfully');
      return refreshResult.data;
    } else {
      console.error('Invalid response from token refresh:', refreshResult);
      throw new Error('Invalid response from token refresh');
    }
  } catch (error) {
    console.error('Error in refreshTokenAndRetry:', error);
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