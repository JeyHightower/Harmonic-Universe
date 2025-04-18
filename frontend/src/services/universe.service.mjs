/**
 * Universe Service
 * Handles operations related to universes in the application
 */

import { universeEndpoints } from './endpoints';
import { httpClient } from './http-client';
import { responseHandler } from './response-handler';

/**
 * Get all universes
 * @returns {Promise<object>} - Universes response
 */
export const getAllUniverses = async () => {
  try {
    const response = await httpClient.get(universeEndpoints.list);
    return responseHandler.handleSuccess(response);
  } catch (error) {
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

    // Get the auth token from localStorage
    const token = localStorage.getItem('auth_token');

    // Make the request with explicit authorization header
    const response = await httpClient.get(universeEndpoints.get(id), {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
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
    const response = await httpClient.post(universeEndpoints.create, universeData);
    console.log('universe', 'Universe created successfully', { id: response.id });
    return responseHandler.handleSuccess(response);
  } catch (error) {
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
