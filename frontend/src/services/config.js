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
    return '/api';
  }

  // In development, use the full URL from config or environment
  return API_CONFIG.BASE_URL || 'http://localhost:5001/api';
};

export const API_SERVICE_CONFIG = {
  // Base URL for API requests
  BASE_URL: getApiBaseUrl(),
  
  // API version prefix
  API_PREFIX: API_CONFIG.API_PREFIX || '/api',
  
  // Default request timeout in milliseconds
  TIMEOUT: 30000,
  
  // Cache configuration
  CACHE: {
    ENABLED: true,
    DURATION: 5 * 60 * 1000, // 5 minutes
  },
  
  // Authentication configuration
  AUTH: {
    TOKEN_KEY: AUTH_CONFIG.TOKEN_KEY || 'auth_token',
    TOKEN_TYPE: 'Bearer',
  },
  
  // Retry configuration
  RETRY: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    RETRY_STATUSES: [408, 429, 500, 502, 503, 504],
  },
};

export default API_SERVICE_CONFIG; 