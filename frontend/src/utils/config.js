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
  BASE_URL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  TIMEOUT: 10000,
  HEADERS: {
    "Content-Type": "application/json",
  },
  CORS: {
    CREDENTIALS: true,
    ALLOWED_ORIGINS: parseArray(
      validateEnvVar(
        "VITE_CORS_ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:5173"
      )
    ),
    ALLOWED_METHODS: parseArray(
      validateEnvVar("VITE_CORS_ALLOWED_METHODS", "GET,POST,PUT,DELETE,PATCH")
    ),
    ALLOWED_HEADERS: parseArray(
      validateEnvVar("VITE_CORS_ALLOWED_HEADERS", "Content-Type,Authorization")
    ),
    EXPOSED_HEADERS: parseArray(
      validateEnvVar("VITE_CORS_EXPOSE_HEADERS", "Content-Length,Content-Type")
    ),
    MAX_AGE: parseInt(validateEnvVar("VITE_CORS_MAX_AGE", "600")),
  },
  HEALTH_CHECK: {
    ENDPOINT: "/api/health",
    INTERVAL: parseInt(validateEnvVar("VITE_HEALTH_CHECK_INTERVAL", "30000")),
    TIMEOUT: 3000,
    RETRY_ATTEMPTS: 3,
  },
  ERROR_HANDLING: {
    RETRY_ATTEMPTS: parseInt(validateEnvVar("VITE_API_RETRY_ATTEMPTS", "3")),
    RETRY_DELAY: parseInt(validateEnvVar("VITE_API_RETRY_DELAY", "1000")),
    NETWORK_ERROR_THRESHOLD: parseInt(
      validateEnvVar("VITE_NETWORK_ERROR_THRESHOLD", "5000")
    ),
  },
};

// Authentication configuration
export const AUTH_CONFIG = {
  TOKEN_KEY: "token",
  USER_KEY: "user",
  REFRESH_TOKEN_KEY: "refreshToken",
  TOKEN_EXPIRY: 3600, // 1 hour
  REFRESH_TOKEN_EXPIRY: 604800, // 7 days
  COOKIE_DOMAIN:
    process.env.NODE_ENV === "production"
      ? ".harmonic-universe.com"
      : "localhost",
  COOKIE_SECURE: parseBool(validateEnvVar("VITE_AUTH_COOKIE_SECURE", "false")),
  COOKIE_SAMESITE: validateEnvVar("VITE_AUTH_COOKIE_SAMESITE", "strict"),
  ENDPOINTS: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    REFRESH: "/api/auth/refresh",
    DEMO: "/api/auth/demo-login",
    ME: "/api/auth/me",
  },
};

// Security configuration
export const SECURITY_CONFIG = {
  ENABLE_HTTPS: parseBool(validateEnvVar("VITE_ENABLE_HTTPS", "false")),
  RATE_LIMIT: {
    WINDOW: parseInt(validateEnvVar("VITE_RATE_LIMIT_WINDOW", "900000")),
    MAX_REQUESTS: parseInt(
      validateEnvVar("VITE_RATE_LIMIT_MAX_REQUESTS", "100")
    ),
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

// Monitoring configuration
export const MONITORING_CONFIG = {
  ENABLE_PERFORMANCE: parseBool(
    validateEnvVar("VITE_ENABLE_PERFORMANCE_MONITORING", "false")
  ),
  ENABLE_ERROR_MONITORING: parseBool(
    validateEnvVar("VITE_ENABLE_ERROR_MONITORING", "false")
  ),
  SAMPLE_RATE: parseFloat(validateEnvVar("VITE_MONITORING_SAMPLE_RATE", "0.1")),
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
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  UNIVERSE: "/universe/:id",
  SCENE: "/scene/:id",
  SETTINGS: "/settings",
  PROFILE: "/profile",
};

export const MODAL_TYPES = {
  LOGIN: "LOGIN",
  REGISTER: "REGISTER",
  SETTINGS: "SETTINGS",
  CREATE_UNIVERSE: "CREATE_UNIVERSE",
  EDIT_UNIVERSE: "EDIT_UNIVERSE",
  DELETE_UNIVERSE: "DELETE_UNIVERSE",
  CREATE_SCENE: "CREATE_SCENE",
  EDIT_SCENE: "EDIT_SCENE",
  DELETE_SCENE: "DELETE_SCENE",
  CREATE_PHYSICS_OBJECT: "CREATE_PHYSICS_OBJECT",
  EDIT_PHYSICS_OBJECT: "EDIT_PHYSICS_OBJECT",
  DELETE_PHYSICS_OBJECT: "DELETE_PHYSICS_OBJECT",
  PHYSICS_PARAMETERS: "PHYSICS_PARAMETERS",
  HARMONY_PARAMETERS: "HARMONY_PARAMETERS",
  EXPORT: "EXPORT",
  IMPORT: "IMPORT",
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error occurred. Please check your connection.",
  SERVER_ERROR: "Server error occurred. Please try again later.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION_ERROR: "Please check your input and try again.",
  UNKNOWN_ERROR: "An unknown error occurred. Please try again.",
};
