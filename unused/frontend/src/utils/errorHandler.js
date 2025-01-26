import config from "../config";

// Error types
export const ErrorTypes = {
  API_ERROR: "API_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  AUTH_ERROR: "AUTH_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  WEBSOCKET_ERROR: "WEBSOCKET_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
};

// Error severity levels
export const ErrorSeverity = {
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical",
};

// Custom error class
export class AppError extends Error {
  constructor(
    message,
    type = ErrorTypes.UNKNOWN_ERROR,
    severity = ErrorSeverity.ERROR,
    details = {},
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.severity = severity;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// Error handler function
export const handleError = (error, context = {}) => {
  const errorObj = normalizeError(error);

  // Log error if in development or debug mode
  if (config.debug) {
    console.error("[Error Handler]", {
      ...errorObj,
      context,
    });
  }

  // Send to error reporting service in production
  if (config.env === "production") {
    // TODO: Implement error reporting service integration
    // reportError(errorObj);
  }

  return errorObj;
};

// Normalize different error types into a consistent format
const normalizeError = (error) => {
  if (error instanceof AppError) {
    return error;
  }

  // Handle API errors
  if (error.response) {
    return new AppError(
      error.response.data.message || "API Error",
      ErrorTypes.API_ERROR,
      ErrorSeverity.ERROR,
      {
        status: error.response.status,
        data: error.response.data,
      },
    );
  }

  // Handle network errors
  if (error.request) {
    return new AppError(
      "Network Error",
      ErrorTypes.NETWORK_ERROR,
      ErrorSeverity.ERROR,
      {
        request: error.request,
      },
    );
  }

  // Handle validation errors
  if (error.validation) {
    return new AppError(
      "Validation Error",
      ErrorTypes.VALIDATION_ERROR,
      ErrorSeverity.WARNING,
      {
        validation: error.validation,
      },
    );
  }

  // Handle unknown errors
  return new AppError(
    error.message || "An unknown error occurred",
    ErrorTypes.UNKNOWN_ERROR,
    ErrorSeverity.ERROR,
    {
      originalError: error,
    },
  );
};

// Utility function to check if an error is of a specific type
export const isErrorType = (error, type) => {
  return error instanceof AppError && error.type === type;
};

// Utility function to format error message for display
export const formatErrorMessage = (error) => {
  const errorObj = normalizeError(error);

  switch (errorObj.type) {
    case ErrorTypes.API_ERROR:
      return `API Error: ${errorObj.message}`;
    case ErrorTypes.NETWORK_ERROR:
      return "Network Error: Please check your connection and try again";
    case ErrorTypes.AUTH_ERROR:
      return "Authentication Error: Please log in again";
    case ErrorTypes.VALIDATION_ERROR:
      return `Validation Error: ${errorObj.message}`;
    case ErrorTypes.WEBSOCKET_ERROR:
      return "WebSocket Error: Connection issue";
    default:
      return errorObj.message || "An unknown error occurred";
  }
};
