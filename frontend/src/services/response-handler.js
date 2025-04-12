/**
 * Response Handler
 * Common utilities for handling API responses
 */

import { log } from "../utils/logger";

/**
 * Handle a successful API response
 * @param {any} data - Response data
 * @param {number} status - HTTP status code
 * @param {string} message - Success message (optional)
 * @returns {object} - Standardized response object
 */
export const handleSuccess = (data, status = 200, message = '') => {
  return {
    success: true,
    status,
    message: message || getDefaultSuccessMessage(status),
    data,
  };
};

/**
 * Handle an API error
 * @param {Error} error - Error object from axios or other source
 * @returns {object} - Standardized error response object
 */
export const handleError = (error) => {
  // Get detailed error info
  const status = error.response?.status || 500;
  const message = error.response?.data?.message || error.message || 'Unknown error';
  const data = error.response?.data || null;
  
  // Log the error
  log('api', 'API Error', {
    status,
    message,
    originalError: error.message,
  });
  
  return {
    success: false,
    status,
    message,
    data,
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
        data 
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