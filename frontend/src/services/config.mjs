/**
 * API Configuration
 * 
 * This file exports configuration settings for API services
 */

import { API_CONFIG, AUTH_CONFIG, IS_PRODUCTION } from '../utils/config';

// API Base URL determination
const getApiBaseUrl = () => {
  // Check if we're in a production environment
  if (IS_PRODUCTION) {
    // In production, use relative URL (same origin)
    // Don't include /api as it will be added by formatUrl
    console.log('Using production API URL: empty string (relative)');
    return '';
  }

  // In development, use the full URL from config or environment
  // Don't include /api as it will be added by formatUrl
  const baseUrl = 'http://localhost:5001';
  
  console.log(`Using development API URL: ${baseUrl}`);
  return baseUrl;
};

export const API_SERVICE_CONFIG = {
  // Base URL for API requests
  BASE_URL: getApiBaseUrl(),
  
  // API version prefix
  API_PREFIX: '/api',  // Will be added to BASE_URL if not already included
  
  // Default request timeout in milliseconds
  TIMEOUT: 30000,
  
  // Cache configuration
  CACHE: {
    ENABLED: true,
    DURATION: 5 * 60 * 1000, // 5 minutes
  },
  
  // Authentication configuration - critical to use same keys as AUTH_CONFIG
  AUTH: {
    // Must use the exact same TOKEN_KEY from AUTH_CONFIG to maintain consistency
    TOKEN_KEY: AUTH_CONFIG.TOKEN_KEY,
    TOKEN_TYPE: 'Bearer',
  },
  
  // Retry configuration
  RETRY: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    RETRY_STATUSES: [408, 429, 500, 502, 503, 504],
    BACKOFF_FACTOR: 2,
    // Special handling for rate limiting (429 errors)
    RATE_LIMIT: {
      // Additional delay for rate limit errors (in ms)
      ADDITIONAL_DELAY: 2000,
      // Whether to respect the Retry-After header
      RESPECT_RETRY_AFTER: true,
      // Default delay if no Retry-After header (in ms)
      DEFAULT_RETRY_AFTER: 5000
    }
  },
};

export default API_SERVICE_CONFIG; 