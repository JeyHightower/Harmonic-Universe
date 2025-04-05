/**
 * Configuration settings for the application
 * This file centralizes environment-specific configuration with validation
 */

// Export environment
export const ENV = import.meta.env.MODE || "development";

// Export whether we're in production
export const IS_PRODUCTION = ENV === "production";

// Export whether we're in development
export const IS_DEVELOPMENT = ENV === "development";

// Export whether we're in test
export const IS_TEST = ENV === "test";

// Export the base URL
export const BASE_URL = import.meta.env.BASE_URL || "/";

// Export the public URL
export const PUBLIC_URL = import.meta.env.PUBLIC_URL || "/";

// Export the API URL
export const API_URL = IS_PRODUCTION
  ? '/api' // Use relative URL in production
  : (import.meta.env.VITE_API_URL || "http://localhost:5001/api");

// Export the CDN URL
export const CDN_URL = import.meta.env.VITE_CDN_URL || "";

// Export the version
export const VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";

// Export the build time
export const BUILD_TIME =
  import.meta.env.VITE_BUILD_TIME || new Date().toISOString();

// Export the git hash
export const GIT_HASH = import.meta.env.VITE_GIT_HASH || "";

// Export the environment variables
export const ENV_VARS = {
  NODE_ENV: ENV,
  BASE_URL,
  PUBLIC_URL,
  API_URL,
  CDN_URL,
  VERSION,
  BUILD_TIME,
  GIT_HASH,
};

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
const parseBool = (value) => value === "true";

// Parse array environment variable
const parseArray = (value) => value.split(",").map((item) => item.trim());

// Parse integer environment variable
const parseInt = (value, defaultValue = undefined) => {
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// API configuration
export const API_CONFIG = {
  BASE_URL: IS_PRODUCTION
    ? '/api' // Use relative URL in production
    : (import.meta.env.VITE_API_URL || "http://localhost:5001/api"),
  TIMEOUT: 10000,
  HEADERS: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  CORS: {
    CREDENTIALS: true,
    ALLOWED_ORIGINS: parseArray(
      validateEnvVar(
        "VITE_CORS_ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:3000"
      )
    ),
    ALLOWED_METHODS: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    ALLOWED_HEADERS: ["Content-Type", "Authorization", "Accept"],
    EXPOSED_HEADERS: ["Content-Length", "Content-Type", "Authorization"],
    MAX_AGE: 600,
  },
  HEALTH_CHECK: {
    ENDPOINT: "/api/health",
    INTERVAL: 30000,
    TIMEOUT: 3000,
    RETRY_ATTEMPTS: 3,
  },
  ERROR_HANDLING: {
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    NETWORK_ERROR_THRESHOLD: 5000,
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000,
  },
  CACHE: {
    ENABLED: true,
    TTL: 300000, // 5 minutes
  },
};

// Authentication configuration
export const AUTH_CONFIG = {
  TOKEN_KEY: "token",
  USER_KEY: "user",
  REFRESH_TOKEN_KEY: "refreshToken",
  TOKEN_EXPIRY: 3600, // 1 hour
  REFRESH_TOKEN_EXPIRY: 604800, // 7 days
  COOKIE_DOMAIN: IS_PRODUCTION ? ".harmonic-universe.com" : "localhost",
  COOKIE_SECURE: IS_PRODUCTION,
  COOKIE_SAMESITE: "strict",
  ENDPOINTS: {
    LOGIN: IS_PRODUCTION ? "/auth/login" : "/api/auth/login",
    SIGNUP: IS_PRODUCTION ? "/auth/signup" : "/api/auth/signup",
    LOGOUT: IS_PRODUCTION ? "/auth/logout" : "/api/auth/logout",
    REFRESH: IS_PRODUCTION ? "/auth/refresh" : "/api/auth/refresh",
    DEMO: IS_PRODUCTION ? "/auth/demo-login" : "/api/auth/demo-login",
    VALIDATE: IS_PRODUCTION ? "/auth/validate" : "/api/auth/validate",
  },
};

// Security configuration
export const SECURITY_CONFIG = {
  ENABLE_HTTPS: parseBool(validateEnvVar("VITE_ENABLE_HTTPS", "false")),
  RATE_LIMIT: {
    ENABLED: parseBool(validateEnvVar("VITE_RATE_LIMIT_ENABLED", "true")),
    MAX_REQUESTS: parseInt(
      validateEnvVar("VITE_RATE_LIMIT_MAX_REQUESTS", "100")
    ),
    WINDOW_MS: parseInt(validateEnvVar("VITE_RATE_LIMIT_WINDOW_MS", "60000")), // 1 minute
  },
  PASSWORD: {
    MIN_LENGTH: parseInt(validateEnvVar("VITE_PASSWORD_MIN_LENGTH", "8")),
    MAX_LENGTH: parseInt(validateEnvVar("VITE_PASSWORD_MAX_LENGTH", "128")),
    REQUIRE_UPPERCASE: parseBool(
      validateEnvVar("VITE_PASSWORD_REQUIRE_UPPERCASE", "true")
    ),
    REQUIRE_LOWERCASE: parseBool(
      validateEnvVar("VITE_PASSWORD_REQUIRE_LOWERCASE", "true")
    ),
    REQUIRE_NUMBERS: parseBool(
      validateEnvVar("VITE_PASSWORD_REQUIRE_NUMBERS", "true")
    ),
    REQUIRE_SYMBOLS: parseBool(
      validateEnvVar("VITE_PASSWORD_REQUIRE_SYMBOLS", "true")
    ),
  },
  JWT: {
    STORAGE_KEY: validateEnvVar("VITE_JWT_STORAGE_KEY", "token"),
    REFRESH_KEY: validateEnvVar("VITE_JWT_REFRESH_KEY", "refreshToken"),
    EXPIRY_BUFFER: parseInt(validateEnvVar("VITE_JWT_EXPIRY_BUFFER", "300")), // 5 minutes
  },
  CSRF: {
    ENABLED: parseBool(validateEnvVar("VITE_CSRF_ENABLED", "true")),
    HEADER_NAME: validateEnvVar("VITE_CSRF_HEADER_NAME", "X-CSRF-Token"),
  },
};

// Feature flags
export const FEATURES = {
  ENABLE_MFA: parseBool(validateEnvVar("VITE_ENABLE_MFA", "false")),
  ENABLE_PASSWORD_RESET: parseBool(
    validateEnvVar("VITE_ENABLE_PASSWORD_RESET", "true")
  ),
  ENABLE_ACCOUNT_LOCKOUT: parseBool(
    validateEnvVar("VITE_ENABLE_ACCOUNT_LOCKOUT", "true")
  ),
  ENABLE_DEBUG_LOGGING: parseBool(
    validateEnvVar("VITE_ENABLE_DEBUG_LOGGING", "false")
  ),
  MOCK_AUTH_IN_DEV: parseBool(validateEnvVar("VITE_MOCK_AUTH_IN_DEV", "false")),
  DEMO_MODE: parseBool(validateEnvVar("VITE_FEATURE_DEMO_MODE", "false")),
  OFFLINE_MODE: parseBool(validateEnvVar("VITE_FEATURE_OFFLINE_MODE", "true")),
  DEBUG_MODE: parseBool(validateEnvVar("VITE_FEATURE_DEBUG_MODE", "false")),
  ANALYTICS: parseBool(validateEnvVar("VITE_FEATURE_ANALYTICS", "false")),
  PERFORMANCE_MONITORING: parseBool(
    validateEnvVar("VITE_FEATURE_PERFORMANCE_MONITORING", "true")
  ),
};

// Session configuration
export const SESSION_CONFIG = {
  TIMEOUT: parseInt(validateEnvVar("VITE_SESSION_TIMEOUT", "3600000")),
  ENABLE_KEEPALIVE: parseBool(
    validateEnvVar("VITE_ENABLE_SESSION_KEEPALIVE", "true")
  ),
  RENEW_THRESHOLD: parseInt(
    validateEnvVar("VITE_SESSION_RENEW_THRESHOLD", "300000")
  ),
};

/**
 * Configuration for monitoring and error tracking
 * @typedef {Object} MonitoringConfig
 * @property {boolean} ENABLE_ERROR_MONITORING - Enable/disable error monitoring
 * @property {number} SAMPLE_RATE - Sampling rate for error reporting (0-1)
 * @property {number} MAX_ERRORS_PER_MINUTE - Maximum number of errors to report per minute
 * @property {number} ERROR_WINDOW - Error reporting window in milliseconds
 * @property {Object} MONITORING_SERVICE - Monitoring service configuration
 * @property {string[]} IGNORED_ERRORS - Error categories to ignore
 * @property {Object.<string, Function>} CUSTOM_HANDLERS - Custom error handlers for specific error types
 */
export const MONITORING_CONFIG = {
  ENABLE_ERROR_MONITORING: IS_PRODUCTION,
  SAMPLE_RATE: 0.1,
  MAX_ERRORS_PER_MINUTE: 100,
  ERROR_WINDOW: 60000,
  MONITORING_SERVICE: {},
  IGNORED_ERRORS: ["NetworkError", "TimeoutError", "ValidationError"],
  CUSTOM_HANDLERS: {},
};

// Theme configuration
export const THEME_CONFIG = {
  LIGHT: {
    primary: "#4a90e2",
    secondary: "#f39c12",
    background: "#ffffff",
    text: "#333333",
    error: "#e74c3c",
    success: "#2ecc71",
    warning: "#f1c40f",
    info: "#3498db",
  },
  DARK: {
    primary: "#3498db",
    secondary: "#e67e22",
    background: "#1a1a1a",
    text: "#ffffff",
    error: "#c0392b",
    success: "#27ae60",
    warning: "#d35400",
    info: "#2980b9",
  },
};

// Physics configuration
export const PHYSICS_CONFIG = {
  GRAVITY: 9.81,
  TIME_STEP: 0.016,
  MAX_STEPS: 1000,
  DAMPING: 0.99,
  RESTITUTION: 0.8,
  FRICTION: 0.5,
};

// Music configuration
export const MUSIC_CONFIG = {
  SAMPLE_RATE: 44100,
  BUFFER_SIZE: 2048,
  MAX_DURATION: 300, // 5 minutes in seconds
  MIN_FREQUENCY: 20,
  MAX_FREQUENCY: 20000,
  DEFAULT_TEMPO: 120,
  DEFAULT_VOLUME: 0.7,
};

// Export a default configuration object that combines all configs
export default {
  api: API_CONFIG,
  auth: AUTH_CONFIG,
  security: SECURITY_CONFIG,
  features: FEATURES,
  session: SESSION_CONFIG,
  monitoring: MONITORING_CONFIG,
  theme: THEME_CONFIG,
  physics: PHYSICS_CONFIG,
  music: MUSIC_CONFIG,
};

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  DASHBOARD: "/dashboard",
  UNIVERSE: "/universe/:id",
  SCENE: "/scene/:id",
  SETTINGS: "/settings",
  PROFILE: "/profile",
};

// Modal configuration
export const MODAL_CONFIG = {
  TYPES: {
    DEFAULT: "default",
    ALERT: "alert",
    CONFIRMATION: "confirmation",
    FORM: "form",
    INFO: "info",
    ERROR: "error",
    SUCCESS: "success",
    WARNING: "warning",
  },
  SIZES: {
    SMALL: "400px",
    MEDIUM: "600px",
    LARGE: "800px",
    XLARGE: "1000px",
  },
  POSITIONS: {
    CENTER: "center",
    TOP: "top",
    BOTTOM: "bottom",
    LEFT: "left",
    RIGHT: "right",
  },
  ANIMATIONS: {
    FADE: {
      duration: 200,
      timing: "ease-in-out",
    },
    SLIDE: {
      duration: 300,
      timing: "ease-in-out",
    },
    SCALE: {
      duration: 200,
      timing: "ease-in-out",
    },
  },
  DEFAULT_SETTINGS: {
    size: "MEDIUM",
    position: "CENTER",
    animation: "FADE",
    draggable: true,
    closeOnBackdrop: true,
    closeOnEscape: true,
  },
  STYLES: {
    backdrop: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      backdropFilter: "blur(4px)",
    },
    modal: {
      backgroundColor: "#ffffff",
      borderRadius: "8px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      padding: "24px",
    },
    header: {
      marginBottom: "16px",
      paddingBottom: "16px",
      borderBottom: "1px solid #e0e0e0",
    },
    content: {
      marginBottom: "24px",
    },
    footer: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "8px",
      paddingTop: "16px",
      borderTop: "1px solid #e0e0e0",
    },
    button: {
      padding: "8px 16px",
      borderRadius: "4px",
      border: "none",
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    primaryButton: {
      backgroundColor: "#1976d2",
      color: "#ffffff",
    },
    secondaryButton: {
      backgroundColor: "#e0e0e0",
      color: "#000000",
    },
  },
  RESPONSIVE: {
    breakpoints: {
      mobile: "320px",
      tablet: "768px",
      desktop: "1024px",
    },
    sizes: {
      mobile: {
        SMALL: "90vw",
        MEDIUM: "95vw",
        LARGE: "98vw",
        XLARGE: "100vw",
      },
      tablet: {
        SMALL: "400px",
        MEDIUM: "600px",
        LARGE: "800px",
        XLARGE: "90vw",
      },
      desktop: {
        SMALL: "400px",
        MEDIUM: "600px",
        LARGE: "800px",
        XLARGE: "1000px",
      },
    },
  },
};

// Modal style utility functions
export const getModalSizeStyles = (
  size = MODAL_CONFIG.DEFAULT_SETTINGS.size
) => {
  return {
    width: MODAL_CONFIG.SIZES[size] || MODAL_CONFIG.SIZES.MEDIUM,
    maxWidth: "90vw",
    maxHeight: "90vh",
    overflow: "auto",
  };
};

export const getModalTypeStyles = (type) => {
  const baseStyles = {
    ...MODAL_CONFIG.STYLES.modal,
    ...getModalSizeStyles(),
  };

  switch (type) {
    case "ALERT":
      return {
        ...baseStyles,
        ...MODAL_CONFIG.STYLES.alert,
      };
    case "CONFIRMATION":
      return {
        ...baseStyles,
        ...MODAL_CONFIG.STYLES.confirmation,
      };
    case "FORM":
      return {
        ...baseStyles,
        ...MODAL_CONFIG.STYLES.form,
      };
    default:
      return baseStyles;
  }
};

export const getModalAnimationStyles = (
  animation = MODAL_CONFIG.DEFAULT_SETTINGS.animation
) => {
  const { duration, timing } =
    MODAL_CONFIG.ANIMATIONS[animation] || MODAL_CONFIG.ANIMATIONS.FADE;

  return {
    transition: `all ${duration}ms ${timing}`,
    opacity: 1,
    transform: "translateY(0)",
  };
};

export const getModalPositionStyles = (
  position = MODAL_CONFIG.DEFAULT_SETTINGS.position
) => {
  switch (position) {
    case "TOP":
      return {
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
      };
    case "BOTTOM":
      return {
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
      };
    case "LEFT":
      return {
        top: "50%",
        left: "20px",
        transform: "translateY(-50%)",
      };
    case "RIGHT":
      return {
        top: "50%",
        right: "20px",
        transform: "translateY(-50%)",
      };
    default:
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
  }
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error occurred. Please check your connection.",
  SERVER_ERROR: "Server error occurred. Please try again later.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION_ERROR: "Please check your input and try again.",
  UNKNOWN_ERROR: "An unknown error occurred. Please try again.",
};

/**
 * Application-wide configuration
 * @typedef {Object} AppConfig
 * @property {Object} API - API configuration
 * @property {string} API.BASE_URL - Base URL for API endpoints
 * @property {number} API.TIMEOUT - API timeout in milliseconds
 * @property {Object} FEATURES - Feature flags
 * @property {boolean} FEATURES.ENABLE_ANALYTICS - Enable/disable analytics
 * @property {boolean} FEATURES.ENABLE_LOGGING - Enable/disable logging
 * @property {Object} SECURITY - Security settings
 * @property {number} SECURITY.MAX_LOGIN_ATTEMPTS - Maximum login attempts
 * @property {number} SECURITY.SESSION_TIMEOUT - Session timeout in milliseconds
 * @property {number} SECURITY.PASSWORD_MIN_LENGTH - Minimum password length
 * @property {Object} PERFORMANCE - Performance settings
 * @property {number} PERFORMANCE.CACHE_TTL - Cache time-to-live in milliseconds
 * @property {number} PERFORMANCE.DEBOUNCE_DELAY - Debounce delay in milliseconds
 * @property {number} PERFORMANCE.THROTTLE_DELAY - Throttle delay in milliseconds
 */
export const APP_CONFIG = {
  API: {
    BASE_URL: IS_PRODUCTION
      ? '/api' // Use relative URL in production
      : (import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api"),
    TIMEOUT: 30000,
  },
  FEATURES: {
    ENABLE_ANALYTICS: IS_PRODUCTION,
    ENABLE_LOGGING: IS_DEVELOPMENT,
  },
  SECURITY: {
    MAX_LOGIN_ATTEMPTS: 5,
    SESSION_TIMEOUT: 3600000,
    PASSWORD_MIN_LENGTH: 8,
  },
  PERFORMANCE: {
    CACHE_TTL: 3600000,
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 1000,
  },
};
