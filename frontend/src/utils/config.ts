/**
 * Configuration for monitoring and error tracking
 */
export const MONITORING_CONFIG = {
  // Enable/disable error monitoring
  ENABLE_ERROR_MONITORING: process.env.NODE_ENV === 'production',
  
  // Sampling rate for error reporting (0-1)
  SAMPLE_RATE: 0.1, // Report 10% of errors
  
  // Maximum number of errors to report per minute
  MAX_ERRORS_PER_MINUTE: 100,
  
  // Error reporting window in milliseconds
  ERROR_WINDOW: 60000, // 1 minute
  
  // Monitoring service configuration
  MONITORING_SERVICE: {
    // Add your monitoring service configuration here
    // Example: Sentry DSN, LogRocket ID, etc.
  },
  
  // Error categories to ignore
  IGNORED_ERRORS: [
    'NetworkError',
    'TimeoutError',
    'ValidationError',
  ],
  
  // Custom error handlers
  CUSTOM_HANDLERS: {
    // Add custom error handlers for specific error types
  },
};

/**
 * Application-wide configuration
 */
export const APP_CONFIG = {
  // API endpoints
  API: {
    BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:3000',
    TIMEOUT: 30000, // 30 seconds
  },
  
  // Feature flags
  FEATURES: {
    ENABLE_ANALYTICS: process.env.NODE_ENV === 'production',
    ENABLE_LOGGING: process.env.NODE_ENV === 'development',
  },
  
  // Security settings
  SECURITY: {
    MAX_LOGIN_ATTEMPTS: 5,
    SESSION_TIMEOUT: 3600000, // 1 hour
    PASSWORD_MIN_LENGTH: 8,
  },
  
  // Performance settings
  PERFORMANCE: {
    CACHE_TTL: 3600000, // 1 hour
    DEBOUNCE_DELAY: 300, // 300ms
    THROTTLE_DELAY: 1000, // 1 second
  },
};

/**
 * Type definitions for configuration
 */
export interface MonitoringConfig {
  ENABLE_ERROR_MONITORING: boolean;
  SAMPLE_RATE: number;
  MAX_ERRORS_PER_MINUTE: number;
  ERROR_WINDOW: number;
  MONITORING_SERVICE: Record<string, any>;
  IGNORED_ERRORS: string[];
  CUSTOM_HANDLERS: Record<string, Function>;
}

export interface AppConfig {
  API: {
    BASE_URL: string;
    TIMEOUT: number;
  };
  FEATURES: {
    ENABLE_ANALYTICS: boolean;
    ENABLE_LOGGING: boolean;
  };
  SECURITY: {
    MAX_LOGIN_ATTEMPTS: number;
    SESSION_TIMEOUT: number;
    PASSWORD_MIN_LENGTH: number;
  };
  PERFORMANCE: {
    CACHE_TTL: number;
    DEBOUNCE_DELAY: number;
    THROTTLE_DELAY: number;
  };
} 