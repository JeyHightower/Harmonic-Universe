/**
 * HTTP Client
 * Core client for making HTTP requests with configured defaults
 */

import axios from 'axios';
// Replace the import with a local log function
const log = (category, message, data) => {
  if (!import.meta.env.PROD) {
    console.log(`[${category}] ${message}`, data || '');
  }
};

import { API_SERVICE_CONFIG } from './config';

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
    log('api', 'Response error', {
      status,
      url,
      method,
      message: error.message,
    });

    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      // Potential place to refresh token or logout
      log('api', 'Authentication error', { url });
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
    
    const response = await axiosInstance.get(formattedUrl, options);
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
    
    const response = await axiosInstance.post(formattedUrl, data, options);
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
    
    const response = await axiosInstance.put(formattedUrl, data, options);
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
    
    const response = await axiosInstance.patch(formattedUrl, data, options);
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
    
    const response = await axiosInstance.delete(formattedUrl, options);
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