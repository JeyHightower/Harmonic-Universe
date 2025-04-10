/**
 * Response Handler Module
 * Standardizes API responses and error handling
 */

import { log } from '../../utils/logger';
import { notification } from 'antd';

/**
 * Standard response format
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether the request was successful
 * @property {any} data - The response data
 * @property {string} message - A human-readable message
 * @property {string} [code] - Error code if applicable
 * @property {number} [status] - HTTP status code
 */

/**
 * Response handler service for API responses
 */
export const responseHandler = {
  /**
   * Process successful response
   * @param {Object} response - Response object from axios
   * @param {Object} options - Processing options
   * @returns {ApiResponse} Standardized response
   */
  success: (response, options = {}) => {
    const { showNotification = false, notificationMessage = null } = options;
    
    // Extract data and metadata
    const status = response?.status || 200;
    const responseData = response?.data || {};
    
    // Build standardized response
    const result = {
      success: true,
      data: responseData?.data || responseData,
      message: responseData?.message || 'Request successful',
      status
    };
    
    // Show notification if requested
    if (showNotification) {
      notification.success({
        message: 'Success',
        description: notificationMessage || result.message
      });
    }
    
    return result;
  },
  
  /**
   * Process error response
   * @param {Error} error - Error object
   * @param {Object} options - Processing options
   * @returns {ApiResponse} Standardized error response
   */
  error: (error, options = {}) => {
    const { 
      showNotification = true, 
      notificationMessage = null,
      logError = true
    } = options;
    
    // Extract error details
    const status = error?.response?.status || 500;
    const errorData = error?.response?.data || {};
    const errorMessage = errorData?.message || error?.message || 'An error occurred';
    const errorCode = errorData?.code || `ERROR_${status}`;
    
    // Build standardized error response
    const result = {
      success: false,
      data: null,
      message: errorMessage,
      code: errorCode,
      status,
      original: error
    };
    
    // Log error if requested
    if (logError) {
      log('api', errorMessage, { 
        status, 
        code: errorCode,
        url: error?.config?.url,
        method: error?.config?.method
      });
    }
    
    // Show notification if requested
    if (showNotification) {
      notification.error({
        message: 'Error',
        description: notificationMessage || errorMessage
      });
    }
    
    return result;
  },
  
  /**
   * Handle special error cases
   * @param {Error} error - Error object
   * @returns {boolean} True if special case was handled
   */
  handleSpecialCases: (error) => {
    // Handle authentication errors
    if (error?.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login?session_expired=true';
      return true;
    }
    
    // Handle server unavailable
    if (error?.response?.status === 503 || error?.message?.includes('Network Error')) {
      notification.error({
        message: 'Server Unavailable',
        description: 'The server is currently unavailable. Please try again later.'
      });
      return true;
    }
    
    // Handle rate limiting
    if (error?.response?.status === 429) {
      notification.warning({
        message: 'Rate Limit Exceeded',
        description: 'You have made too many requests. Please wait a moment and try again.'
      });
      return true;
    }
    
    return false;
  },
  
  /**
   * Create a custom response
   * @param {boolean} success - Whether the operation was successful
   * @param {any} data - Response data
   * @param {string} message - Response message
   * @param {Object} extra - Additional fields
   * @returns {ApiResponse} Standardized response
   */
  custom: (success, data, message, extra = {}) => {
    return {
      success,
      data,
      message,
      ...extra
    };
  }
};

export default responseHandler; 