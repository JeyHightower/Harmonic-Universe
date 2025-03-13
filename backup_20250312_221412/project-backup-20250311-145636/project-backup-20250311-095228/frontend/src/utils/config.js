/**
 * Configuration settings for the application
 * This file centralizes environment-specific configuration
 */

// API configuration
const API_CONFIG = {
  // Base URL for API requests
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  API_PREFIX: '/api',
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10), // 30 seconds
  // CORS configuration
  CORS: {
    CREDENTIALS: true, // Include credentials in cross-origin requests
    ALLOWED_ORIGINS: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5000',
      import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
    ],
    ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    ALLOWED_HEADERS: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept'
    ],
    EXPOSED_HEADERS: ['Content-Length', 'Content-Type'],
    MAX_AGE: parseInt(import.meta.env.VITE_CORS_MAX_AGE || '600', 10), // 10 minutes
  },
  // Health check endpoint
  HEALTH_CHECK: {
    ENDPOINT: '/api/health',
    INTERVAL: parseInt(import.meta.env.VITE_HEALTH_CHECK_INTERVAL || '30000', 10), // 30 seconds
    TIMEOUT: 3000, // 3 seconds
    RETRY_ATTEMPTS: 3,
  },
  // Error handling
  ERROR_HANDLING: {
    RETRY_ATTEMPTS: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || '3', 10),
    RETRY_DELAY: parseInt(import.meta.env.VITE_API_RETRY_DELAY || '1000', 10), // 1 second
    NETWORK_ERROR_THRESHOLD: parseInt(import.meta.env.VITE_NETWORK_ERROR_THRESHOLD || '5000', 10), // 5 seconds
  }
};

// Authentication configuration
const AUTH_CONFIG = {
  // Token storage key in localStorage
  TOKEN_KEY: 'harmonic_universe_token',
  // User data storage key in localStorage
  USER_KEY: 'harmonic_universe_user',
  // Token expiration time in milliseconds (default: 24 hours)
  TOKEN_EXPIRATION: parseInt(import.meta.env.VITE_TOKEN_EXPIRATION || '86400000', 10),
  // Authentication endpoints
  ENDPOINTS: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    DEMO: '/auth/demo-login'
  }
};

// Feature flags
const FEATURES = {
  // Enable/disable experimental features
  ENABLE_EXPERIMENTAL: import.meta.env.VITE_ENABLE_EXPERIMENTAL === 'true',
  // Enable/disable debug logging
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
  // Enable/disable offline mode
  OFFLINE_MODE: import.meta.env.VITE_OFFLINE_MODE === 'true',
};

// Export configuration objects
export { API_CONFIG, AUTH_CONFIG, FEATURES };

// Export a default configuration object that combines all configs
export default {
  api: API_CONFIG,
  auth: AUTH_CONFIG,
  features: FEATURES,
};
