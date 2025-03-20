/**
 * Configuration settings for the application
 * This file centralizes environment-specific configuration
 */

// API configuration
const API_CONFIG = {
  // Base URL for API requests
  // In development, this should point to your local API server
  // In production, this should point to your deployed API
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  API_PREFIX: '/api/v1',
  TIMEOUT: import.meta.env.VITE_API_TIMEOUT || 30000, // 30 seconds
  // CORS configuration
  CORS: {
    CREDENTIALS: true, // Include credentials in cross-origin requests
    ALLOWED_ORIGINS: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8000',
      import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    ]
  }
};

// Authentication configuration
const AUTH_CONFIG = {
  // Token storage key in localStorage
  TOKEN_KEY: 'harmonic_universe_token',
  // User data storage key in localStorage
  USER_KEY: 'harmonic_universe_user',
  // Token expiration time in milliseconds (default: 24 hours)
  TOKEN_EXPIRATION: 24 * 60 * 60 * 1000,
};

// Feature flags
const FEATURES = {
  // Enable/disable experimental features
  ENABLE_EXPERIMENTAL: false,
  // Enable/disable debug logging
  DEBUG_MODE: false,
};

// Export configuration objects
export { API_CONFIG, AUTH_CONFIG, FEATURES };

// Export a default configuration object that combines all configs
export default {
  api: API_CONFIG,
  auth: AUTH_CONFIG,
  features: FEATURES,
};
