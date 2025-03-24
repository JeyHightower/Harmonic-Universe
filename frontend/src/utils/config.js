/**
 * Configuration settings for the application
 * This file centralizes environment-specific configuration with validation
 */

// Utility function to validate required environment variables
const validateEnvVar = (key, defaultValue = undefined, validator = null) => {
  const value = import.meta.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  if (validator && !validator(value)) {
    throw new Error(`Invalid value for environment variable: ${key}`);
  }
  return value;
};

// Parse boolean environment variable
const parseBool = (value) => value === 'true';

// Parse array environment variable
const parseArray = (value) => value.split(',').map(item => item.trim());

// Parse integer environment variable
const parseInt = (value, defaultValue = undefined) => {
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// API configuration
export const API_CONFIG = {
  BASE_URL: validateEnvVar('VITE_API_BASE_URL', 'http://localhost:5000'),
  TIMEOUT: parseInt(validateEnvVar('VITE_API_TIMEOUT', '30000')),
  CORS: {
    CREDENTIALS: true,
    ALLOWED_ORIGINS: parseArray(validateEnvVar('VITE_CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173')),
    ALLOWED_METHODS: parseArray(validateEnvVar('VITE_CORS_ALLOWED_METHODS', 'GET,POST,PUT,DELETE,PATCH')),
    ALLOWED_HEADERS: parseArray(validateEnvVar('VITE_CORS_ALLOWED_HEADERS', 'Content-Type,Authorization')),
    EXPOSED_HEADERS: parseArray(validateEnvVar('VITE_CORS_EXPOSE_HEADERS', 'Content-Length,Content-Type')),
    MAX_AGE: parseInt(validateEnvVar('VITE_CORS_MAX_AGE', '600')),
  },
  HEALTH_CHECK: {
    ENDPOINT: '/api/health',
    INTERVAL: parseInt(validateEnvVar('VITE_HEALTH_CHECK_INTERVAL', '30000')),
    TIMEOUT: 3000,
    RETRY_ATTEMPTS: 3,
  },
  ERROR_HANDLING: {
    RETRY_ATTEMPTS: parseInt(validateEnvVar('VITE_API_RETRY_ATTEMPTS', '3')),
    RETRY_DELAY: parseInt(validateEnvVar('VITE_API_RETRY_DELAY', '1000')),
    NETWORK_ERROR_THRESHOLD: parseInt(validateEnvVar('VITE_NETWORK_ERROR_THRESHOLD', '5000')),
  }
};

// Authentication configuration
export const AUTH_CONFIG = {
  TOKEN_EXPIRY: parseInt(validateEnvVar('VITE_AUTH_TOKEN_EXPIRY', '86400000')),
  REFRESH_TOKEN_EXPIRY: parseInt(validateEnvVar('VITE_REFRESH_TOKEN_EXPIRY', '604800000')),
  COOKIE_DOMAIN: validateEnvVar('VITE_AUTH_COOKIE_DOMAIN', 'localhost'),
  COOKIE_SECURE: parseBool(validateEnvVar('VITE_AUTH_COOKIE_SECURE', 'false')),
  COOKIE_SAMESITE: validateVar('VITE_AUTH_COOKIE_SAMESITE', 'strict'),
  ENDPOINTS: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    DEMO: '/auth/demo-login'
  }
};

// Security configuration
export const SECURITY_CONFIG = {
  ENABLE_HTTPS: parseBool(validateVar('VITE_ENABLE_HTTPS', 'false')),
  RATE_LIMIT: {
    WINDOW: parseInt(validateVar('VITE_RATE_LIMIT_WINDOW', '900000')),
    MAX_REQUESTS: parseInt(validateVar('VITE_RATE_LIMIT_MAX_REQUESTS', '100')),
  },
  PASSWORD: {
    MIN_LENGTH: parseInt(validateVar('VITE_PASSWORD_MIN_LENGTH', '8')),
    MAX_LENGTH: parseInt(validateVar('VITE_PASSWORD_MAX_LENGTH', '128')),
    REQUIRE_UPPERCASE: parseBool(validateVar('VITE_PASSWORD_REQUIRE_UPPERCASE', 'true')),
    REQUIRE_LOWERCASE: parseBool(validateVar('VITE_PASSWORD_REQUIRE_LOWERCASE', 'true')),
    REQUIRE_NUMBERS: parseBool(validateVar('VITE_PASSWORD_REQUIRE_NUMBERS', 'true')),
    REQUIRE_SYMBOLS: parseBool(validateVar('VITE_PASSWORD_REQUIRE_SYMBOLS', 'true')),
  }
};

// Feature flags
export const FEATURES = {
  ENABLE_MFA: parseBool(validateVar('VITE_ENABLE_MFA', 'false')),
  ENABLE_PASSWORD_RESET: parseBool(validateVar('VITE_ENABLE_PASSWORD_RESET', 'true')),
  ENABLE_ACCOUNT_LOCKOUT: parseBool(validateVar('VITE_ENABLE_ACCOUNT_LOCKOUT', 'true')),
  ENABLE_DEBUG_LOGGING: parseBool(validateVar('VITE_ENABLE_DEBUG_LOGGING', 'false')),
  MOCK_AUTH_IN_DEV: parseBool(validateVar('VITE_MOCK_AUTH_IN_DEV', 'false')),
};

// Session configuration
export const SESSION_CONFIG = {
  TIMEOUT: parseInt(validateVar('VITE_SESSION_TIMEOUT', '3600000')),
  ENABLE_KEEPALIVE: parseBool(validateVar('VITE_ENABLE_SESSION_KEEPALIVE', 'true')),
  RENEW_THRESHOLD: parseInt(validateVar('VITE_SESSION_RENEW_THRESHOLD', '300000')),
};

// Monitoring configuration
export const MONITORING_CONFIG = {
  ENABLE_PERFORMANCE: parseBool(validateVar('VITE_ENABLE_PERFORMANCE_MONITORING', 'false')),
  ENABLE_ERROR_MONITORING: parseBool(validateVar('VITE_ENABLE_ERROR_MONITORING', 'false')),
  SAMPLE_RATE: parseFloat(validateVar('VITE_MONITORING_SAMPLE_RATE', '0.1')),
};

// Export a default configuration object that combines all configs
export default {
  api: API_CONFIG,
  auth: AUTH_CONFIG,
  security: SECURITY_CONFIG,
  features: FEATURES,
  session: SESSION_CONFIG,
  monitoring: MONITORING_CONFIG,
};
