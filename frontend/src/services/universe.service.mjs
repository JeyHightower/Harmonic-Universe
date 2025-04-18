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

    const response = await httpClient.get(universeEndpoints.get(id));
    return responseHandler.handleSuccess(response);
  } catch (error) {
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
