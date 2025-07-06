/**
 * Error Service
 * Centralized error handling and reporting service
 */

import { API_CONFIG } from '../utils/config.mjs';

/**
 * Log an error to the console and optionally to a remote service
 * @param {Error} error - The error object
 * @param {string} source - The source of the error
 * @param {Object} context - Additional context for the error
 */
export const logError = (error, source = 'unknown', context = {}) => {
  console.error(`Error in ${source}:`, error, context);

  // In production, we might want to send this to a remote logging service
  if (API_CONFIG.ERROR_LOGGING_ENABLED) {
    // Implementation for remote error logging would go here
  }
};

/**
 * Format an error message for display to the user
 * @param {Error|string} error - The error object or message
 * @param {string} fallback - Fallback message if error is undefined
 * @returns {string} Formatted error message
 */
export const formatErrorMessage = (error, fallback = 'An unexpected error occurred') => {
  if (!error) return fallback;

  if (typeof error === 'string') return error;

  if (error.message) return error.message;

  return fallback;
};

/**
 * Handle API errors in a consistent way
 * @param {Error} error - The API error object
 * @param {Object} options - Options for error handling
 * @returns {Object} Formatted error response
 */
export const handleApiError = (error, options = {}) => {
  const { showNotification = true, throwError = false } = options;

  const errorMessage = formatErrorMessage(error);

  if (showNotification) {
    // Implementation for showing notification would go here
    // This would typically integrate with your notification system
  }

  if (throwError) {
    throw new Error(errorMessage);
  }

  return {
    error: true,
    message: errorMessage,
    details: error,
  };
};

/**
 * Create a specialized error handler for specific features
 * @param {string} featureName - The name of the feature
 * @returns {Function} A specialized error handler
 */
export const createErrorHandler = (featureName) => {
  return (error, options = {}) => {
    logError(error, featureName, options);
    return handleApiError(error, options);
  };
};

export default {
  logError,
  formatErrorMessage,
  handleApiError,
  createErrorHandler,
};
