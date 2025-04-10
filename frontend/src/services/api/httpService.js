/**
 * HTTP Service Module
 * Centralizes API request handling using axios
 */

import axios from 'axios';
import { getAuthHeaders, formatUrl } from './utilityApi';
import responseHandler from './responseHandler';
import { log } from '../../utils/logger';

/**
 * Creates a configured instance of axios
 * @param {Object} config - Additional axios configuration
 * @returns {Object} Configured axios instance
 */
const createAxiosInstance = (config = {}) => {
  // Create instance with default configuration
  const instance = axios.create({
    timeout: 30000, // 30 seconds
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...config.headers
    },
    ...config
  });
  
  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      // Log request (optional)
      log('api', `${config.method?.toUpperCase()} ${config.url}`, { params: config.params });
      
      // Return modified config
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  // Response interceptor
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      // Check for special error cases (like auth failures)
      if (responseHandler.handleSpecialCases(error)) {
        return Promise.reject(error);
      }
      
      // Return rejected promise with error
      return Promise.reject(error);
    }
  );
  
  return instance;
};

/**
 * Default axios instance
 */
const http = createAxiosInstance();

/**
 * HTTP Service for making API calls
 */
export const httpService = {
  /**
   * Make a GET request
   * @param {string} url - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<ApiResponse>} Standardized response
   */
  get: async (url, options = {}) => {
    const { params, headers = {}, useAuth = true, responseOptions = {} } = options;
    
    try {
      // Format URL and prepare request config
      const formattedUrl = formatUrl(url);
      const requestConfig = {
        params,
        headers: {
          ...headers,
          ...(useAuth ? await getAuthHeaders() : {})
        }
      };
      
      // Make request
      const response = await http.get(formattedUrl, requestConfig);
      
      // Process and return standardized response
      return responseHandler.success(response, responseOptions);
    } catch (error) {
      return responseHandler.error(error, responseOptions);
    }
  },
  
  /**
   * Make a POST request
   * @param {string} url - API endpoint
   * @param {Object} data - Request body
   * @param {Object} options - Request options
   * @returns {Promise<ApiResponse>} Standardized response
   */
  post: async (url, data = {}, options = {}) => {
    const { headers = {}, useAuth = true, responseOptions = {} } = options;
    
    try {
      // Format URL and prepare request config
      const formattedUrl = formatUrl(url);
      const requestConfig = {
        headers: {
          ...headers,
          ...(useAuth ? await getAuthHeaders() : {})
        }
      };
      
      // Make request
      const response = await http.post(formattedUrl, data, requestConfig);
      
      // Process and return standardized response
      return responseHandler.success(response, responseOptions);
    } catch (error) {
      return responseHandler.error(error, responseOptions);
    }
  },
  
  /**
   * Make a PUT request
   * @param {string} url - API endpoint
   * @param {Object} data - Request body
   * @param {Object} options - Request options
   * @returns {Promise<ApiResponse>} Standardized response
   */
  put: async (url, data = {}, options = {}) => {
    const { headers = {}, useAuth = true, responseOptions = {} } = options;
    
    try {
      // Format URL and prepare request config
      const formattedUrl = formatUrl(url);
      const requestConfig = {
        headers: {
          ...headers,
          ...(useAuth ? await getAuthHeaders() : {})
        }
      };
      
      // Make request
      const response = await http.put(formattedUrl, data, requestConfig);
      
      // Process and return standardized response
      return responseHandler.success(response, responseOptions);
    } catch (error) {
      return responseHandler.error(error, responseOptions);
    }
  },
  
  /**
   * Make a DELETE request
   * @param {string} url - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<ApiResponse>} Standardized response
   */
  delete: async (url, options = {}) => {
    const { headers = {}, useAuth = true, responseOptions = {} } = options;
    
    try {
      // Format URL and prepare request config
      const formattedUrl = formatUrl(url);
      const requestConfig = {
        headers: {
          ...headers,
          ...(useAuth ? await getAuthHeaders() : {})
        }
      };
      
      // Make request
      const response = await http.delete(formattedUrl, requestConfig);
      
      // Process and return standardized response
      return responseHandler.success(response, responseOptions);
    } catch (error) {
      return responseHandler.error(error, responseOptions);
    }
  },
  
  /**
   * Make a multipart/form-data POST request (file upload)
   * @param {string} url - API endpoint
   * @param {FormData} formData - Form data including files
   * @param {Object} options - Request options
   * @returns {Promise<ApiResponse>} Standardized response
   */
  upload: async (url, formData, options = {}) => {
    const { 
      headers = {}, 
      useAuth = true, 
      responseOptions = {}, 
      onProgress = null 
    } = options;
    
    try {
      // Format URL and prepare request config
      const formattedUrl = formatUrl(url);
      const requestConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...headers,
          ...(useAuth ? await getAuthHeaders() : {})
        }
      };
      
      // Add upload progress handler if provided
      if (onProgress) {
        requestConfig.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted, progressEvent);
        };
      }
      
      // Make request
      const response = await http.post(formattedUrl, formData, requestConfig);
      
      // Process and return standardized response
      return responseHandler.success(response, responseOptions);
    } catch (error) {
      return responseHandler.error(error, responseOptions);
    }
  },
  
  /**
   * Create a cancelable request
   * @returns {Object} Object with request method and cancel function
   */
  createCancelableRequest: () => {
    const controller = new AbortController();
    const { signal } = controller;
    
    return {
      /**
       * Makes a request that can be canceled
       * @param {Function} requestFn - Function that makes the actual request
       * @returns {Promise} Promise that resolves with the request result
       */
      request: (requestFn) => requestFn({ signal }),
      
      /**
       * Cancels the request
       */
      cancel: () => controller.abort()
    };
  },
  
  /**
   * Get direct access to the axios instance
   * @returns {Object} Axios instance
   */
  getInstance: () => http
};

export default httpService; 