// API Configuration
export const API_BASE_URL = 'http://localhost:8000';

// Other configuration constants
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

// Environment-specific configuration
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

// Export all configurations as a default object as well
export default {
  API_BASE_URL,
  DEFAULT_HEADERS,
  isDevelopment,
  isProduction,
};
