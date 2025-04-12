/**
 * HTTP Client
 * Core client for making HTTP requests with configured defaults
 */

import axios from 'axios';
import { API_SERVICE_CONFIG } from './config';

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

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful response
    log('api', 'Response received', {
      status: response.status,
      url: response.config.url,
    });

    return response;
  },
  (error) => {
    // Get error details
    const status = error.response ? error.response.status : 'No status';
    const url = error.config ? error.config.url : 'Unknown URL';
    const method = error.config ? error.config.method?.toUpperCase() : 'Unknown Method';

    // Log error
    logError(`${method} ${url} - ${status}`, {
      status,
      url,
      method,
      message: error.message,
      data: error.response?.data
    });

    // Handle 401 Unauthorized errors (token expired or invalid)
    if (error.response && error.response.status === 401) {
      // Check if it's a signature verification failure or other auth error
      const errorMessage = error.response.data?.message || '';
      const isTokenError = 
        errorMessage.includes('Signature verification failed') || 
        errorMessage.includes('Invalid token') ||
        errorMessage.includes('expired') ||
        errorMessage.includes('Token has expired') ||
        errorMessage.includes('Not enough segments') ||
        errorMessage.includes('authentication');
        
      if (isTokenError) {
        logError('Authentication token invalid or expired', {
          message: errorMessage,
          url,
          method
        });
        
        // Mark token as verification failed to trigger a redirect to login
        localStorage.setItem("token_verification_failed", "true");
        
        // Clear ALL auth related values from localStorage - use consistent keys from config
        localStorage.removeItem(API_SERVICE_CONFIG.AUTH.TOKEN_KEY);
        
        // Also clear user and refresh token with proper keys from the config
        try {
          // Use dynamic import to avoid circular dependencies
          import('../utils/config').then(({ AUTH_CONFIG }) => {
            localStorage.removeItem(AUTH_CONFIG.USER_KEY);
            localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
            log('api', 'Cleared all auth related localStorage items');
          }).catch(err => {
            // Fallback to common keys if import fails
            localStorage.removeItem("user");
            localStorage.removeItem("refreshToken");
            log('api', 'Cleared auth related localStorage items with fallback keys');
          });
        } catch (err) {
          // Ultra-safe fallback
          localStorage.removeItem("user");
          localStorage.removeItem("refreshToken");
          log('api', 'Cleared auth related localStorage with fallback due to error', { error: err.message });
        }
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Format a URL to include the API base if not already included
 * @param {string} url - URL to format
 * @returns {string} - Formatted URL
 */
const formatUrl = (url) => {
  if (url.startsWith('http')) {
    return url;
  }

  // If URL already starts with the API prefix, don't add it
  if (url.startsWith(API_SERVICE_CONFIG.API_PREFIX)) {
    return url;
  }

  // If URL starts with a slash, append it to API prefix
  if (url.startsWith('/')) {
    return `${API_SERVICE_CONFIG.API_PREFIX}${url}`;
  }

  // Otherwise, add a slash and append it to API prefix
  return `${API_SERVICE_CONFIG.API_PREFIX}/${url}`;
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