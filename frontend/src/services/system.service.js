/**
 * System Service
 * Handles operations related to system-level functionality
 */

import Logger from "../utils/logger";
import { httpClient } from './http-client';
import { systemEndpoints } from './endpoints';
import { responseHandler } from './response-handler';

/**
 * Check the health of the API
 * @returns {Promise<object>} - Health status response
 */
export const checkHealth = async () => {
  try {
    const response = await httpClient.get(systemEndpoints.health);
    return responseHandler.handleSuccess(response);
  } catch (error) {
    log('system', 'Error checking API health', { error: error.message });
    return responseHandler.handleError(error);
  }
};

/**
 * Get the API version information
 * @returns {Promise<object>} - Version information
 */
export const getVersion = async () => {
  try {
    const response = await httpClient.get(systemEndpoints.version);
    return responseHandler.handleSuccess(response);
  } catch (error) {
    log('system', 'Error fetching API version', { error: error.message });
    return responseHandler.handleError(error);
  }
};

/**
 * Ping the API to check connectivity
 * @returns {Promise<object>} - Ping response
 */
export const ping = async () => {
  try {
    const response = await httpClient.get(systemEndpoints.ping);
    return responseHandler.handleSuccess(response);
  } catch (error) {
    log('system', 'Error pinging API', { error: error.message });
    return responseHandler.handleError(error);
  }
};

/**
 * Get system configuration
 * @returns {Promise<object>} - System configuration
 */
export const getSystemConfig = async () => {
  try {
    const response = await httpClient.get(systemEndpoints.config);
    return responseHandler.handleSuccess(response);
  } catch (error) {
    log('system', 'Error fetching system configuration', { error: error.message });
    return responseHandler.handleError(error);
  }
};

/**
 * Get system metrics
 * @returns {Promise<object>} - System metrics
 */
export const getSystemMetrics = async () => {
  try {
    const response = await httpClient.get(systemEndpoints.metrics);
    return responseHandler.handleSuccess(response);
  } catch (error) {
    log('system', 'Error fetching system metrics', { error: error.message });
    return responseHandler.handleError(error);
  }
};

/**
 * System service object
 */
export const systemService = {
  checkHealth,
  getVersion,
  ping,
  getSystemConfig,
  getSystemMetrics
};

export default systemService;
