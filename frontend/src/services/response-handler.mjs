/**
 * Response Handler
 * Common utilities for handling API responses
 */

import { log } from '../utils/logger.jsx';

/**
 * Handle successful API responses
 * @param {Object} response - The response object from axios
 * @returns {Object} The processed response data
 */
export const handleSuccess = (response) => {
  // For direct API responses from axios
  if (response && response.data !== undefined) {
    return response;
  }

  // For responses that are already processed or direct data
  return response;
};

/**
 * Handle API errors with improved clarity and consistency
 * @param {Error|Object} error - Error object (can be axios error, regular Error, or custom object)
 * @returns {Object} Standardized error response
 */
export const handleError = (error) => {
  // Log all errors for debugging
  log('api-error', error.message || 'Unknown error', {
    status: error.response?.status,
    data: error.response?.data,
    url: error.config?.url,
  });

  // Handle axios error response
  if (error.response) {
    // Server responded with a status code outside the 2xx range
    const { status, data, statusText } = error.response;

    // Specifically handle 500 errors with more detail
    if (status >= 500) {
      // Track server errors distinctly
      log('server-error', 'Server responded with an error', {
        status,
        url: error.config?.url,
        data,
      });

      // Create a better error object
      const enhancedError = {
        message:
          data?.message || `Server Error (${status}): ${statusText || 'Internal Server Error'}`,
        status,
        data,
        serverError: true,
        originalError: error,
      };

      // Dispatch a custom event to notify the app
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('server-error', {
            detail: {
              status,
              url: error.config?.url,
              message: enhancedError.message,
            },
          })
        );
      }

      return enhancedError;
    }

    return {
      message: data?.message || data?.error || statusText || 'API request failed',
      status,
      data,
    };
  }

  // Handle network errors (like CORS, network down)
  if (error.request) {
    // The request was made but no response was received
    return {
      message: 'Network error: No response received from server',
      networkError: true,
    };
  }

  // Something else caused the error
  return {
    message: error.message || 'Unknown error occurred',
    originalError: error,
  };
};

/**
 * Get a default success message based on status code
 * @param {number} status - HTTP status code
 * @returns {string} - Default success message
 */
const getDefaultSuccessMessage = (status) => {
  switch (status) {
    case 200:
      return 'Request successful';
    case 201:
      return 'Resource created successfully';
    case 204:
      return 'Request processed successfully';
    default:
      return 'Operation completed successfully';
  }
};

/**
 * Handle response data validation
 * @param {any} data - Response data to validate
 * @param {function} validator - Validation function
 * @returns {object} - Validation result
 */
export const validateResponse = (data, validator) => {
  try {
    if (!validator) {
      return {
        valid: true,
        data,
      };
    }

    const isValid = validator(data);
    return {
      valid: isValid,
      data: isValid ? data : null,
    };
  } catch (error) {
    log('api', 'Response validation error', { error: error.message });
    return {
      valid: false,
      data: null,
      error: error.message,
    };
  }
};

/**
 * Parse JSON response safely
 * @param {string} jsonString - JSON string to parse
 * @returns {object} - Parsed object or error info
 */
export const parseJSON = (jsonString) => {
  try {
    return {
      success: true,
      data: JSON.parse(jsonString),
    };
  } catch (error) {
    log('api', 'JSON parsing error', { error: error.message });
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Check if a response indicates an API error
 * @param {object} response - Response to check
 * @returns {boolean} - True if response indicates an error
 */
export const isErrorResponse = (response) => {
  return (
    !response ||
    response.success === false ||
    response.error ||
    (response.status && response.status >= 400)
  );
};

/**
 * Extract useful data from a response object
 * @param {object} response - API response
 * @param {string} defaultMessage - Default message if none in response
 * @returns {object} - Processed response data
 */
export const processResponseData = (response, defaultMessage = '') => {
  // If it's already in our standard format, return it
  if (response && typeof response === 'object' && 'success' in response) {
    return response;
  }

  // For axios responses directly
  if (response && response.status && response.data) {
    return handleSuccess(response.data, response.status, defaultMessage);
  }

  // For other responses, wrap them in our standard format
  return handleSuccess(response, 200, defaultMessage);
};

// Export as a single object for convenient imports
export const responseHandler = {
  handleSuccess,
  handleError,
  validateResponse,
  parseJSON,
  isErrorResponse,
  processResponseData,
};

export default responseHandler;
