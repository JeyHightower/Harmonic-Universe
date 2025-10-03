/**
 * Universe Service
 * Handles operations related to universes in the application
 */

import { AUTH_CONFIG } from '../utils/config.jsx';
import { demoService } from './demo.service.mjs';
import { universeEndpoints } from './endpoints.mjs';
import { httpClient } from './http-client.mjs';
import { responseHandler } from './response-handler.mjs';

/**
 * Get all universes by user Id
 * @params{number/string} userId - User Id
 * @returns {Promise<object>} - Universes response

 */

export const getAllUniverses = async (id) => {
  try {
    // Check if this is a demo session
    if (demoService.isDemoSession()) {
      console.log('Fetching universes for demo user');
      // Use the same endpoint but with demo-specific headers
      const response = await httpClient.get(universeEndpoints.list, {
        headers: {
          'X-Demo-User': 'true',
        },
      });

      // Handle server error responses
      if (response && response.serverError) {
        console.error('Server error in demo universe loading:', response);
        return responseHandler.handleError(new Error(response.message || 'Server error occurred'));
      }

      // Check if response exists and has the expected structure
      if (!response || typeof response !== 'object') {
        console.error('Invalid response format from demo universe loading:', response);
        return responseHandler.handleError(new Error('Invalid response format from server'));
      }

      // For demo mode, if no universes property, create empty array
      if (!response.universes) {
        console.log('No universes property in demo response, creating empty array');
        response.universes = [];
      }

      // Ensure universes is an array
      if (!Array.isArray(response.universes)) {
        console.error('Response universes is not an array:', response.universes);
        response.universes = [];
      }

      return responseHandler.handleSuccess(response);
    }

    // Regular user flow
    console.log('Fetching universes for regular user');
    const response = await httpClient.get(universeEndpoints.list);

    console.log('Universe service response:', response);

    // Handle server error responses
    if (response && response.serverError) {
      console.error('Server error in universe loading:', response);

      // Check if it's a database error
      if (response.data && response.data.error && response.data.error.includes('psycopg2')) {
        console.error('Database error detected:', response.data.error);
        return responseHandler.handleError(
          new Error('Database connection error. Please try again later.')
        );
      }

      return responseHandler.handleError(new Error(response.message || 'Server error occurred'));
    }

    // Check if response exists and has the expected structure
    if (!response || typeof response !== 'object') {
      console.error('Invalid response format from universe loading:', response);
      return responseHandler.handleError(new Error('Invalid response format from server'));
    }

    // Handle case where backend returns error in response body
    if (response.error) {
      console.error('Error in response body:', response.error);
      return responseHandler.handleError(new Error(response.message || response.error));
    }

    // For regular mode, if no universes property, create empty array
    if (!response.universes) {
      console.log('No universes property in response, creating empty array');
      response.universes = [];
    }

    // Ensure universes is an array
    if (!Array.isArray(response.universes)) {
      console.error('Response universes is not an array:', response.universes);
      response.universes = [];
    }

    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.error('Error loading universes:', error);

    // Handle specific error types
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      console.error('HTTP Error Response:', {
        status,
        data: errorData,
        message: error.message,
      });

      // Handle specific status codes
      switch (status) {
        case 500:
          if (errorData && errorData.error && errorData.error.includes('psycopg2')) {
            return responseHandler.handleError(
              new Error('Database connection error. Please check your database configuration.')
            );
          }
          return responseHandler.handleError(
            new Error('Internal server error. Please try again later.')
          );

        case 401:
          return responseHandler.handleError(
            new Error('Authentication required. Please log in again.')
          );

        case 403:
          return responseHandler.handleError(
            new Error('Access denied. You do not have permission to view universes.')
          );

        case 404:
          return responseHandler.handleError(
            new Error('Universes endpoint not found. Please check your API configuration.')
          );

        default:
          return responseHandler.handleError(
            new Error(`Server error (${status}): ${errorData?.message || error.message}`)
          );
      }
    }

    // Handle network errors
    if (error.code === 'ERR_NETWORK') {
      return responseHandler.handleError(
        new Error('Network error. Please check your internet connection and server status.')
      );
    }

    return responseHandler.handleError(error);
  }
};

/**
 * Get a universe by ID
 * @param {number|string} id - Universe ID
 * @returns {Promise<object>} - Universe response
 */
export const getUniverseById = async (id) => {
  try {
    if (!id) {
      return responseHandler.handleError(new Error('Universe ID is required'));
    }

    // Log this request for debugging
    console.log(`Fetching universe with ID: ${id}`);

    // Check if this is a demo session
    const isDemo = demoService.isDemoSession();
    console.log(`getUniverseById: isDemo = ${isDemo}`);

    // Get the auth token from localStorage
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);

    // Prepare headers
    const headers = {
      Authorization: token ? `Bearer ${token}` : undefined,
    };

    // Add demo user header if this is a demo session
    if (isDemo) {
      headers['X-Demo-User'] = 'true';
      console.log('getUniverseById: Added X-Demo-User header for demo session');
    }

    // Make the request with explicit authorization header
    const response = await httpClient.get(universeEndpoints.get(id), {
      headers,
      withCredentials: true,
    });

    console.log(`Successfully fetched universe with ID: ${id}`);
    return responseHandler.handleSuccess(response);
  } catch (error) {
    // Handle specific error codes with helpful messages
    if (error.response) {
      if (error.response.status === 403) {
        console.error(`Permission denied to access universe ID: ${id}`);
        return responseHandler.handleError({
          ...error,
          message:
            'You do not have permission to access this universe. It may be private or belong to another user.',
        });
      } else if (error.response.status === 404) {
        console.error(`Universe ID: ${id} not found`);
        return responseHandler.handleError({
          ...error,
          message:
            'The requested universe could not be found. It may have been deleted or never existed.',
        });
      } else if (error.response.status === 401) {
        console.error(`Authentication required to access universe ID: ${id}`);
        return responseHandler.handleError({
          ...error,
          message: 'Authentication required. Please log in to access this universe.',
        });
      }
    }

    return responseHandler.handleError(error);
  }
};

/**
 * Create a new universe
 * @param {object} universeData - Universe data
 * @returns {Promise<object>} - Creation response
 */
export const createUniverse = async (universeData) => {
  try {
    // Check if this is a demo session
    const isDemo = demoService.isDemoSession();

    const response = await httpClient.post(universeEndpoints.create, universeData, {
      headers: {
        'X-Demo-User': isDemo ? 'true' : undefined,
      },
    });

    console.log('universe', 'Universe created successfully', { id: response.id });
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.error('Error creating universe:', error);
    return responseHandler.handleError(error);
  }
};

/**
 * Update an existing universe
 * @param {number|string} id - Universe ID
 * @param {object} universeData - Updated universe data
 * @returns {Promise<object>} - Update response
 */
export const updateUniverse = async (id, universeData) => {
  try {
    if (!id) {
      return responseHandler.handleError(new Error('Universe ID is required'));
    }

    const response = await httpClient.put(universeEndpoints.update(id), universeData);
    console.log('universe', 'Universe updated successfully', { id });
    return responseHandler.handleSuccess(response);
  } catch (error) {
    return responseHandler.handleError(error);
  }
};

/**
 * Delete a universe
 * @param {number|string} id - Universe ID
 * @returns {Promise<object>} - Deletion response
 */
export const deleteUniverse = async (id) => {
  try {
    if (!id) {
      return responseHandler.handleError(new Error('Universe ID is required'));
    }

    const response = await httpClient.delete(universeEndpoints.delete(id));
    console.log('universe', 'Universe deleted successfully', { id });
    return responseHandler.handleSuccess(response);
  } catch (error) {
    return responseHandler.handleError(error);
  }
};

/**
 * Get physics parameters for a universe
 * @param {number|string} id - Universe ID
 * @returns {Promise<object>} - Physics parameters response
 */
export const getUniversePhysics = async (id) => {
  try {
    if (!id) {
      return responseHandler.handleError(new Error('Universe ID is required'));
    }

    const response = await httpClient.get(universeEndpoints.physics(id));
    return responseHandler.handleSuccess(response);
  } catch (error) {
    return responseHandler.handleError(error);
  }
};

/**
 * Generate music for a universe
 * @param {number|string} id - Universe ID
 * @param {object} options - Music generation options
 * @returns {Promise<object>} - Music generation response
 */
export const generateUniverseMusic = async (id, options = {}) => {
  try {
    if (!id) {
      return responseHandler.handleError(new Error('Universe ID is required'));
    }

    const response = await httpClient.post(universeEndpoints.generateMusic(id), options);
    console.log('universe', 'Music generation initiated', { id });
    return responseHandler.handleSuccess(response);
  } catch (error) {
    return responseHandler.handleError(error);
  }
};

/**
 * Download music for a universe
 * @param {number|string} id - Universe ID
 * @param {number|string} musicId - Music track ID
 * @returns {Promise<Blob>} - Music file blob
 */
export const downloadUniverseMusic = async (id, musicId) => {
  try {
    if (!id || !musicId) {
      return responseHandler.handleError(new Error('Universe ID and music ID are required'));
    }

    const blob = await httpClient.download(universeEndpoints.getMusic(id, musicId));
    return responseHandler.handleSuccess(blob);
  } catch (error) {
    return responseHandler.handleError(error);
  }
};

/**
 * Universe service object
 */
export const universeService = {
  getAllUniverses,
  getUniverseById,
  createUniverse,
  updateUniverse,
  deleteUniverse,
  getUniversePhysics,
  generateUniverseMusic,
  downloadUniverseMusic,
};

export default universeService;
