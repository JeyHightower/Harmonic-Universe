/**
 * HTTP Client
 * Core client for making HTTP requests with configured defaults
 */

import axios from 'axios';
import { API_CONFIG } from '../utils/config';
import { log } from '../utils/logger.mjs';
import { authService } from './auth.service.mjs';
import { API_SERVICE_CONFIG } from './config.mjs';

let isRefreshing = false;
let refreshPromise = null;

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
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl) {
      // Don't include /api as it will be added by formatUrl
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
      // For production, use relative URL (same domain)
      // Don't include /api in the base URL as it will be added by formatUrl
      logApiOperation('getBaseUrl-production', { url: '' });
      window.apiDebug.baseUrl = '';
      return '';
    }

    // Default for local development: use localhost:5001
    // Don't include /api in the base URL as it will be added by formatUrl
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
    Accept: 'application/json',
    // Remove Origin header as it's a protected header that can't be set manually
  },
  withCredentials: true, // Important for CORS with credentials
  xsrfCookieName: 'csrf_token',
  xsrfHeaderName: 'X-CSRFToken',
});

// Enable CORS debugging
const enableCorsDebugging = () => {
  if (typeof window !== 'undefined') {
    // Only enable in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('CORS debugging enabled');

      // Monitor CORS-related console errors
      const originalConsoleError = console.error;
      console.error = function (...args) {
        const errorMessage = args.join(' ');

        // Filter out repeated audio initialization errors that we've already handled
        if (errorMessage.includes('Audio initialization already in progress')) {
          // Don't log these errors to the console, they're being handled by our audio system
          // But still track them for debugging
          if (window.apiDebug) {
            window.apiDebug.audioErrors = window.apiDebug.audioErrors || [];
            window.apiDebug.audioErrors.push({
              time: new Date().toISOString(),
              message: errorMessage,
              count: (window.__AUDIO_ERROR_COUNT = (window.__AUDIO_ERROR_COUNT || 0) + 1),
            });
          }

          // Only log the first few occurrences, then suppress
          if (window.__AUDIO_ERROR_COUNT <= 3) {
            originalConsoleError.apply(console, args);
          }

          return;
        }

        if (errorMessage.includes('CORS') || errorMessage.includes('cross-origin')) {
          console.log(
            '%c CORS ERROR DETECTED! ',
            'background: #e74c3c; color: white; font-size: 12px; padding: 2px 5px; border-radius: 3px;'
          );
          console.log('Request details:', {
            baseURL: axiosInstance.defaults.baseURL,
            withCredentials: axiosInstance.defaults.withCredentials,
          });

          // Suggest enabling CORS proxy
          console.log(
            '%c Try enabling CORS proxy: localStorage.setItem("use_cors_proxy", "true") and refresh ',
            'background: #3498db; color: white; font-size: 12px; padding: 2px 5px; border-radius: 3px;'
          );

          // Store info for debugging
          if (window.apiDebug) {
            window.apiDebug.corsErrors = window.apiDebug.corsErrors || [];
            window.apiDebug.corsErrors.push({
              time: new Date().toISOString(),
              message: errorMessage,
            });
          }
        }
        originalConsoleError.apply(console, args);
      };
    }
  }
};

// Call to enable CORS debugging
enableCorsDebugging();

// Log the base URL being used
logApiOperation('api-client-initialized', {
  baseURL: getBaseUrl(),
  config: {
    withCredentials: true,
    timeout: API_CONFIG.TIMEOUT,
  },
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

// Request interceptor for authentication and retry handling
axiosInstance.interceptors.request.use(
  async (config) => {
    logApiOperation('request-interceptor', {
      url: config.url,
      method: config.method,
      headers: config.headers,
    });

    // Store original timeout for potential retries
    config._originalTimeout = config.timeout || API_CONFIG.TIMEOUT;

    // Add custom header for tracking request attempts
    config.headers = config.headers || {};
    config.headers['X-Request-Attempt'] = config.headers['X-Request-Attempt']
      ? parseInt(config.headers['X-Request-Attempt']) + 1
      : 1;

    // Log attempt count if retrying
    const attemptCount = parseInt(config.headers['X-Request-Attempt']);
    if (attemptCount > 1) {
      logApiOperation('request-retry', {
        attemptCount,
        url: config.url,
      });
    }

    // Retry configuration
    const maxRetries = config._retryMax || API_SERVICE_CONFIG.MAX_RETRIES;

    // Add token from local storage if available and not already present
    try {
      // Only add auth token if not previously set
      const token = getToken();
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
        logApiOperation('auth-token-added', { token: `${token.substring(0, 5)}...` });
      }
    } catch (error) {
      logApiOperation('auth-token-error', { message: error.message });
      // Continue with request even if token can't be added
    }

    // Add CORS proxy if needed
    if (config.url && shouldUseCorsProxy()) {
      config.url = getCorsProxyUrl(config.url);
      logApiOperation('request-proxied', { url: config.url });
    }

    return config;
  },
  (error) => {
    logApiOperation('request-error', {
      message: error.message,
      code: error.code,
    });

    // For retryable errors, set up retry logic
    if (error.message.includes('timeout') || error.message.includes('Network Error')) {
      return Promise.reject(error);
    }

    // For server errors (500), track and improve error details
    if (error.response && error.response.status >= 500) {
      logApiOperation('server-error', {
        status: error.response.status,
        url: error.config?.url,
        data: error.response.data,
      });

      // Add better error message
      error.message = `Server Error (${error.response.status}): ${error.response.data?.message || 'Internal Server Error'}`;
    }

    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    // Log success response
    logApiOperation('response-success', {
      url: response.config.url,
      status: response.status,
      size: response.data ? JSON.stringify(response.data).length : 0,
    });

    // For successful responses, we can consider caching if it's a GET request
    if (response.config.method.toLowerCase() === 'get' && response.config.cache !== false) {
      const cacheKey = response.config.url;
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
        status: response.status,
        headers: response.headers,
      });
      logApiOperation('response-cached', { url: cacheKey });
    }

    return response;
  },
  async (error) => {
    // Log response error
    logApiOperation('response-error', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
    });

    // Handle server errors (500) better
    if (error.response && error.response.status >= 500) {
      logApiOperation('server-error', {
        status: error.response.status,
        url: error.config?.url,
        data: error.response.data,
      });

      // Add better error message
      error.message = `Server Error (${error.response.status}): ${error.response.data?.message || 'Internal Server Error'}`;

      // Ensure the error has proper response details
      error.serverError = true;

      // Dispatch an event to notify the app about server error
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('server-error', {
            detail: {
              status: error.response.status,
              url: error.config?.url,
              message: error.message,
            },
          })
        );
      }

      return Promise.reject(error);
    }

    // Original error handling logic for non-500 errors
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle server errors (500s) with retry logic
    const maxRetries = 2;
    const isServerError = error.response && error.response.status >= 500;
    const safeToRetry =
      !originalRequest.method ||
      ['get', 'options', 'head'].includes(originalRequest.method.toLowerCase());
    const attemptsMade = originalRequest.headers['X-Request-Attempt']
      ? parseInt(originalRequest.headers['X-Request-Attempt'])
      : 1;

    if (isServerError && originalRequest && attemptsMade <= maxRetries && safeToRetry) {
      logApiOperation('server-error-retry', {
        status: error.response.status,
        url: originalRequest.url,
        attempt: attemptsMade,
        maxRetries,
      });

      // Add a small delay before retrying to give the server time to recover
      await new Promise((resolve) => setTimeout(resolve, 1000 * attemptsMade));

      // Retry the request with updated headers
      return axiosInstance(originalRequest);
    }

    // If it's a server error but we won't retry, log it specially
    if (isServerError) {
      logApiOperation('server-error-no-retry', {
        status: error.response.status,
        url: originalRequest?.url,
        method: originalRequest?.method,
        reason:
          attemptsMade > maxRetries
            ? 'max-retries-exceeded'
            : !safeToRetry
              ? 'unsafe-method'
              : 'unknown',
      });

      // Add clearer error message
      error.message = `Server error (${error.response.status}): ${error.message}`;
    }

    // Handle Method Not Allowed (405) errors
    if (error.response?.status === 405) {
      logApiOperation('method-not-allowed', {
        url: originalRequest.url,
        method: originalRequest.method,
      });

      // Check if this is an API endpoint that might be misconfigured
      if (originalRequest.url.includes('/api/')) {
        console.error(
          `Method Not Allowed (405) for ${originalRequest.method} ${originalRequest.url}`
        );
        console.log(
          'This may indicate a mismatch between frontend and backend endpoint configuration.'
        );

        // Try to modify the URL by adding or removing trailing slash
        const modifiedUrl = originalRequest.url.endsWith('/')
          ? originalRequest.url.slice(0, -1)
          : originalRequest.url + '/';

        console.log(`Attempting to retry with modified URL: ${modifiedUrl}`);

        // Create a new request with the modified URL
        const retryRequest = { ...originalRequest };
        retryRequest.url = modifiedUrl;
        retryRequest._methodNotAllowedRetry = true;

        return axiosInstance(retryRequest).catch((retryError) => {
          console.error('Modified URL retry also failed:', retryError.message);
          return Promise.reject(error); // Return the original error if retry fails
        });
      }
    }

    // Handle rate limiting (429)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;

      logApiOperation('rate-limit-hit', { waitTime, retryAfter });

      // Wait for the specified time then retry
      await new Promise((resolve) => setTimeout(resolve, waitTime));

      // Retry the request
      return axiosInstance(originalRequest);
    }

    // Handle 401 Unauthorized errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Prevent infinite retry loops
      originalRequest._retry = true;
      logApiOperation('token-refresh-attempt');

      try {
        // Check if we have a token to refresh
        const currentToken = localStorage.getItem(API_SERVICE_CONFIG.AUTH.TOKEN_KEY);
        if (!currentToken) {
          logApiOperation('token-refresh-failed', { reason: 'No token available to refresh' });
          // Clear auth data and redirect to login
          authService.clearAuthData();
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject(new Error('Authentication required - no token available'));
        }

        // Get refresh token and validate format
        const refreshTokenValue = localStorage.getItem(API_SERVICE_CONFIG.AUTH.REFRESH_TOKEN_KEY);
        if (!refreshTokenValue) {
          logApiOperation('token-refresh-failed', { reason: 'No refresh token available' });

          // Set token verification failed flag
          localStorage.setItem('token_verification_failed', 'true');

          // Only clear the main token, don't redirect if we're on a public route
          localStorage.removeItem(API_SERVICE_CONFIG.AUTH.TOKEN_KEY);

          // Only redirect to login if we're not already on a public route
          const publicRoutes = ['/login', '/signup', '/reset-password', '/'];
          const isPublicRoute = publicRoutes.some((route) =>
            window.location.pathname.includes(route)
          );

          if (!isPublicRoute && !window.location.pathname.includes('/login')) {
            console.log('Redirecting to login due to missing refresh token');
            window.location.href = '/?modal=login';
          }

          return Promise.reject(new Error('Authentication required - no refresh token available'));
        }

        // Validate refresh token format before attempting to use it
        const tokenParts = refreshTokenValue.split('.');
        if (tokenParts.length !== 3) {
          logApiOperation('token-refresh-failed', { reason: 'Invalid refresh token format' });
          authService.clearAuthData();
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject(new Error('Invalid refresh token format'));
        }

        // Check if we're already refreshing to prevent multiple refresh calls
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = refreshToken();
        }

        // Wait for the refresh to complete
        const newToken = await refreshPromise;

        // Reset refresh state
        isRefreshing = false;
        refreshPromise = null;

        if (newToken) {
          // Update Authorization header
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

          // Retry the original request
          return axiosInstance(originalRequest);
        } else {
          // If no new token was returned, clear auth and redirect
          authService.clearAuthData();
          window.location.href = '/login';
          return Promise.reject(new Error('Token refresh failed - no new token'));
        }
      } catch (refreshError) {
        logApiOperation('token-refresh-failed', {
          error: refreshError.message,
        });

        // Reset refresh state
        isRefreshing = false;
        refreshPromise = null;

        // Clear auth data and redirect to login on refresh failure
        authService.clearAuthData();

        // Only redirect to login if not already on login page
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login')) {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    // Handle CORS errors
    if (error.message?.includes('Network Error') || error.message?.includes('CORS')) {
      logApiOperation('cors-error', {
        url: error.config?.url,
        headers: error.config?.headers,
      });

      // For debugging purposes
      console.warn('CORS error detected for URL:', error.config?.url);
      console.warn('Request details:', {
        method: error.config?.method,
        withCredentials: error.config?.withCredentials,
        headers: error.config?.headers,
      });

      // Try to automatically enable CORS proxy if the error persists
      const corsErrorCount = window.apiDebug?.corsErrors?.length || 0;
      if (corsErrorCount > 3 && !localStorage.getItem('use_cors_proxy')) {
        console.log(
          '%c Automatically enabling CORS proxy after multiple errors ',
          'background: #f39c12; color: white; font-size: 12px; padding: 2px 5px; border-radius: 3px;'
        );
        localStorage.setItem('use_cors_proxy', 'true');

        // Show a notification to the user
        if (typeof window !== 'undefined' && !window.corsproxy_notification_shown) {
          window.corsproxy_notification_shown = true;
          alert(
            'Network connectivity issues detected. Enabling CORS proxy to improve connectivity. Please refresh the page.'
          );
        }
      }

      // Try using CORS proxy if enabled
      if (shouldUseCorsProxy() && !error.config?.url?.includes('cors-anywhere')) {
        const proxyUrl = getCorsProxyUrl(error.config.url);
        error.config.url = proxyUrl;
        console.log('Retrying request with CORS proxy:', proxyUrl);
        return axiosInstance(error.config);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Format a URL to include the API prefix if not already included
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

  // If URL doesn't start with /, add it first
  if (!url.startsWith('/')) {
    url = '/' + url;
  }

  // Strip any existing /api prefix to prevent duplication
  if (url.startsWith('/api/')) {
    url = url.substring(4); // Remove the '/api' part
  }

  // Now add the /api prefix
  url = '/api' + url;

  // Special case - check if this is a scene endpoint with a numeric ID
  // Using a more strict pattern to match only numeric IDs
  const sceneIdPattern = /\/api\/scenes\/(\d+)$/;
  const match = url.match(sceneIdPattern);

  if (match) {
    const sceneId = match[1];
    console.log(`Scene endpoint with numeric ID ${sceneId} detected, not adding trailing slash`);
    return url; // Return without trailing slash for scene endpoints with numeric IDs
  }

  // Ensure trailing slash to prevent redirects for other endpoints
  if (!url.endsWith('/')) {
    url = url + '/';
  }

  console.log(`Formatted URL: ${url}`);
  return url;
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
    timestamp: Date.now(),
  });
  log('api', 'Cached response', { url });
};

/**
 * Try alternative URLs if primary request fails for certain status codes
 * @param {string} url - The original URL
 * @param {string} method - The HTTP method
 * @param {Error} error - The error from the original request
 * @returns {string|null} - Alternative URL or null if no alternative
 */
const getAlternativeUrl = (url, method, error) => {
  // Only try alternatives for certain status codes
  if (error.response?.status !== 404 && error.response?.status !== 405) {
    return null;
  }

  logApiOperation('trying-alternative-url', {
    originalUrl: url,
    method,
    status: error.response?.status,
  });

  // Special case for scene endpoints with numeric IDs
  const sceneIdPattern = /\/api\/scenes\/(\d+)/;
  const sceneMatch = url.match(sceneIdPattern);

  if (sceneMatch) {
    const sceneId = sceneMatch[1];
    console.log(`Special handling for scene ID endpoint: ${sceneId}`);

    // Try without trailing slash first (higher priority for scenes)
    if (url.endsWith('/')) {
      console.log(`Removing trailing slash from scene endpoint: ${url}`);
      return url.slice(0, -1); // Remove trailing slash
    } else {
      console.log(`Adding trailing slash to scene endpoint: ${url}`);
      return url + '/'; // Add trailing slash
    }
  }

  // Special case for the refresh endpoint
  if (url.includes('/auth/') && method.toLowerCase() === 'post') {
    if (url.endsWith('/')) {
      return url.slice(0, -1); // Remove trailing slash
    } else {
      return url + '/'; // Add trailing slash
    }
  }

  // For universe endpoints
  if (url.includes('/universes/') && !url.includes('/universes/list')) {
    if (url.endsWith('/')) {
      return url.slice(0, -1); // Remove trailing slash
    } else {
      return url + '/'; // Add trailing slash
    }
  }

  // Generic handling for other scene endpoints
  if (url.includes('/scenes/')) {
    if (url.endsWith('/')) {
      return url.slice(0, -1); // Remove trailing slash
    } else {
      return url + '/'; // Add trailing slash
    }
  }

  return null;
};

// Update the withRetry function to use getAlternativeUrl
const withRetry = async (requestFn, options = {}) => {
  const { maxRetries = API_CONFIG.MAX_RETRIES } = options;

  let retries = 0;
  let lastError = null;

  while (retries <= maxRetries) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      // Log the error details
      logApiOperation('request-retry-error', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        retry: retries,
        maxRetries,
      });

      // If we've hit the max retries, throw the error
      if (retries >= maxRetries) {
        throw error;
      }

      // Determine if we should try an alternative URL
      if (error.config && (error.response?.status === 404 || error.response?.status === 405)) {
        const alternativeUrl = getAlternativeUrl(error.config.url, error.config.method, error);

        if (alternativeUrl) {
          logApiOperation('trying-alternative-url', {
            original: error.config.url,
            alternative: alternativeUrl,
          });

          try {
            // Create a new request with the alternative URL
            error.config.url = alternativeUrl;
            const response = await axios(error.config);
            logApiOperation('alternative-url-success', { url: alternativeUrl });
            return response;
          } catch (altError) {
            logApiOperation('alternative-url-failed', {
              url: alternativeUrl,
              status: altError.response?.status,
            });
            console.error('Modified URL retry also failed:', altError.message);
          }
        }
      }

      // Increase retry count
      retries++;

      // Exponential backoff with jitter
      const baseDelay = 200; // 200ms base delay
      const delay = baseDelay * Math.pow(2, retries) + Math.random() * 100;

      console.log(`Retrying request (${retries}/${maxRetries}) after ${delay}ms delay...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // If we've exhausted all retries, throw the last error
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
      error: error.message,
    });
    throw error;
  }
};

/**
 * HTTP POST request
 * @param {string} url - URL to request
 * @param {object} data - Request payload
 * @param {object} options - Request options
 * @returns {Promise<any>} - Response data
 */
const post = async (url, data = {}, options = {}) => {
  const formattedUrl = formatUrl(url);

  // Extra debugging for scene creation
  if (formattedUrl.includes('/api/scenes')) {
    console.log('HTTP Client: Scene-related POST request detected:', {
      url: formattedUrl,
      data: data,
      hasToken: !!getToken(),
      tokenLength: getToken()?.length || 0,
      options: { ...options, headers: options.headers || {} },
    });
  }

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
        return { success: true, message: 'Logged out successfully (client-side only)' };
      }
      throw error;
    }
  }

  // Special handling for auth refresh endpoint to avoid 405 errors
  if (isAuthEndpoint && formattedUrl.includes('/auth/refresh')) {
    // Try to handle both potential endpoint formats (with and without trailing slash)
    try {
      console.log('Attempting token refresh with primary endpoint:', formattedUrl);
      const response = await axiosInstance.post(formattedUrl, data, options);
      return response.data;
    } catch (error) {
      // If we get a 405 Method Not Allowed, try the alternate endpoint format
      if (error.response && error.response.status === 405) {
        console.log('Method not allowed on primary endpoint, trying alternate format');

        // Toggle the trailing slash
        const alternateEndpoint = formattedUrl.endsWith('/')
          ? formattedUrl.slice(0, -1)
          : formattedUrl + '/';

        console.log('Attempting with alternate endpoint:', alternateEndpoint);
        const altResponse = await axiosInstance.post(alternateEndpoint, data, options);
        return altResponse.data;
      }
      throw error;
    }
  }

  // Enhanced logging for scene creation errors
  if (formattedUrl.includes('/api/scenes')) {
    try {
      // Sanitize data to remove any numbered keys that may have been accidentally added
      if (data && typeof data === 'object') {
        const sanitizedData = {};
        Object.keys(data).forEach((key) => {
          // Skip keys that are just digits (0, 1, 2, etc.)
          if (!/^\d+$/.test(key)) {
            sanitizedData[key] = data[key];
          } else {
            console.log('HTTP Client: Removing numeric key from scene data:', key);
          }
        });

        // Replace the original data with sanitized version
        data = sanitizedData;

        console.log('HTTP Client: Sanitized scene data:', data);
      }

      // Make the request with retry logic for scene-related endpoints with enhanced logging
      console.log('HTTP Client: Sending scene POST request');
      const response = await withRetry(async () => {
        const resp = await axiosInstance.post(formattedUrl, data, options);
        console.log('HTTP Client: Scene POST successful', {
          status: resp.status,
          statusText: resp.statusText,
          dataKeys: Object.keys(resp.data || {}),
        });

        // Enhanced logging for scene IDs
        if (resp.data && resp.data.scene && resp.data.scene.id) {
          console.log(
            'HTTP Client: Scene created with ID:',
            resp.data.scene.id,
            'Type:',
            typeof resp.data.scene.id
          );
        }

        return resp;
      }, options);
      return response.data;
    } catch (error) {
      console.error('HTTP Client: Scene POST request failed', {
        url: formattedUrl,
        status: error.response?.status,
        statusText: error.response?.statusText,
        errorData: error.response?.data,
        errorMessage: error.message,
      });
      throw error;
    }
  } else {
    // Make the request with retry logic for regular endpoints
    const response = await withRetry(
      () => axiosInstance.post(formattedUrl, data, options),
      options
    );

    return response.data;
  }
};

/**
 * HTTP PUT request
 * @param {string} url - The URL to request
 * @param {Object} data - The data to send
 * @param {Object} [config] - Axios request config
 * @returns {Promise} - The response promise
 */
const put = async (url, data = {}, options = {}) => {
  const formattedUrl = formatUrl(url);

  // Clear cache for this URL if it exists
  clearCacheForUrl(formattedUrl);

  try {
    // Make the request with retry logic
    const response = await withRetry(() => axiosInstance.put(formattedUrl, data, options), options);
    return response.data;
  } catch (error) {
    // Check for 403 Forbidden errors
    if (error.response && error.response.status === 403) {
      console.error(`Permission denied for PUT ${formattedUrl}:`, error.response.data);
    }
    // Re-throw the error for other handlers
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
      error: error.message,
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
      Authorization: `Bearer ${token}`,
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

    // Check cache first
    const cachedResponse = getCachedResponse(formattedUrl, options);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Make the request with retry logic for cacheable GET requests
    const response = await withRetry(() => axiosInstance.get(formattedUrl, options), options);
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

    // Extra debugging for scene creation
    if (formattedUrl.includes('/api/scenes')) {
      console.log('HTTP Client: Scene-related POST request detected:', {
        url: formattedUrl,
        data: data,
        hasToken: !!getToken(),
        tokenLength: getToken()?.length || 0,
        options: { ...options, headers: options.headers || {} },
      });
    }

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
          return { success: true, message: 'Logged out successfully (client-side only)' };
        }
        throw error;
      }
    }

    // Special handling for auth refresh endpoint to avoid 405 errors
    if (isAuthEndpoint && formattedUrl.includes('/auth/refresh')) {
      // Try to handle both potential endpoint formats (with and without trailing slash)
      try {
        console.log('Attempting token refresh with primary endpoint:', formattedUrl);
        const response = await axiosInstance.post(formattedUrl, data, options);
        return response.data;
      } catch (error) {
        // If we get a 405 Method Not Allowed, try the alternate endpoint format
        if (error.response && error.response.status === 405) {
          console.log('Method not allowed on primary endpoint, trying alternate format');

          // Toggle the trailing slash
          const alternateEndpoint = formattedUrl.endsWith('/')
            ? formattedUrl.slice(0, -1)
            : formattedUrl + '/';

          console.log('Attempting with alternate endpoint:', alternateEndpoint);
          const altResponse = await axiosInstance.post(alternateEndpoint, data, options);
          return altResponse.data;
        }
        throw error;
      }
    }

    // Enhanced logging for scene creation errors
    if (formattedUrl.includes('/api/scenes')) {
      try {
        // Sanitize data to remove any numbered keys that may have been accidentally added
        if (data && typeof data === 'object') {
          const sanitizedData = {};
          Object.keys(data).forEach((key) => {
            // Skip keys that are just digits (0, 1, 2, etc.)
            if (!/^\d+$/.test(key)) {
              sanitizedData[key] = data[key];
            } else {
              console.log('HTTP Client: Removing numeric key from scene data:', key);
            }
          });

          // Replace the original data with sanitized version
          data = sanitizedData;

          console.log('HTTP Client: Sanitized scene data:', data);
        }

        // Make the request with retry logic for scene-related endpoints with enhanced logging
        console.log('HTTP Client: Sending scene POST request');
        const response = await withRetry(async () => {
          const resp = await axiosInstance.post(formattedUrl, data, options);
          console.log('HTTP Client: Scene POST successful', {
            status: resp.status,
            statusText: resp.statusText,
            dataKeys: Object.keys(resp.data || {}),
          });

          // Enhanced logging for scene IDs
          if (resp.data && resp.data.scene && resp.data.scene.id) {
            console.log(
              'HTTP Client: Scene created with ID:',
              resp.data.scene.id,
              'Type:',
              typeof resp.data.scene.id
            );
          }

          return resp;
        }, options);
        return response.data;
      } catch (error) {
        console.error('HTTP Client: Scene POST request failed', {
          url: formattedUrl,
          status: error.response?.status,
          statusText: error.response?.statusText,
          errorData: error.response?.data,
          errorMessage: error.message,
        });
        throw error;
      }
    } else {
      // Make the request with retry logic for regular endpoints
      const response = await withRetry(
        () => axiosInstance.post(formattedUrl, data, options),
        options
      );

      return response.data;
    }
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
    const response = await withRetry(() => axiosInstance.put(formattedUrl, data, options), options);

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

    // Special handling for scene deletion
    if (formattedUrl.includes('/api/scenes/')) {
      try {
        console.log('HTTP Client: Sending scene DELETE request to:', formattedUrl);

        // Try with the current URL (which may have a trailing slash)
        try {
          const response = await axiosInstance.delete(formattedUrl, options);
          console.log('HTTP Client: Scene DELETE successful:', {
            url: formattedUrl,
            status: response.status,
          });
          return response.data;
        } catch (error) {
          // If we get a 405 Method Not Allowed, the endpoint might not support the trailing slash
          if (error.response && error.response.status === 405) {
            console.log('HTTP Client: Method not allowed (405), trying alternate URL format');

            // Toggle the trailing slash
            const alternateUrl = formattedUrl.endsWith('/')
              ? formattedUrl.slice(0, -1)
              : formattedUrl + '/';

            console.log('HTTP Client: Trying DELETE with alternate URL:', alternateUrl);
            const altResponse = await axiosInstance.delete(alternateUrl, options);
            return altResponse.data;
          }

          // For 404 errors, consider the resource already gone (which is the goal of DELETE)
          if (error.response && error.response.status === 404) {
            console.log('HTTP Client: Resource not found (404), treating DELETE as successful');
            return {
              message: 'Resource not found or already deleted',
              success: true,
              id: formattedUrl.split('/').filter(Boolean).pop(),
            };
          }

          // Re-throw for other errors
          throw error;
        }
      } catch (error) {
        console.error('HTTP Client: Scene DELETE request failed', {
          url: formattedUrl,
          status: error.response?.status,
          statusText: error.response?.statusText,
          errorMessage: error.message,
        });
        throw error;
      }
    }

    // Handle regular (non-scene) DELETE requests with retry logic
    const response = await withRetry(() => axiosInstance.delete(formattedUrl, options), options);
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
        'Content-Type': 'multipart/form-data',
      },
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
      responseType: 'blob',
    };

    const response = await axiosInstance.get(formattedUrl, downloadOptions);
    return response.data;
  },

  // Utility methods
  clearCache,
  clearCacheForUrl,
  formatUrl,
  axiosInstance,
};

export {
  addAuthHeader,
  axiosInstance,
  clearCache,
  clearCacheForUrl,
  del,
  get,
  getCorsProxyUrl,
  logApiOperation,
  post,
  put,
  shouldUseCorsProxy,
};

export default httpClient;
