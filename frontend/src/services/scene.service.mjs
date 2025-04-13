/**
 * Scene Service
 * Handles operations related to scenes in the application
 */

import { httpClient } from './http-client';
import { sceneEndpoints } from './endpoints';
import { responseHandler } from './response-handler';

/**
 * Get all scenes
 * @returns {Promise<object>} - List of all scenes
 */
export const getAllScenes = async () => {
  try {
    const response = await httpClient.get(sceneEndpoints.list);
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('scenes', 'Error fetching all scenes', { error: error.message });
    return responseHandler.handleError(error);
  }
};

/**
 * Get scenes for a specific universe
 * @param {number|string} universeId - Universe ID
 * @returns {Promise<object>} - List of scenes for the universe
 */
export const getScenesByUniverse = async (universeId) => {
  try {
    if (!universeId) {
      return responseHandler.handleError(new Error('Universe ID is required'));
    }

    const response = await httpClient.get(sceneEndpoints.forUniverse(universeId));
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('scenes', 'Error fetching universe scenes', { 
      universeId, 
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Get a specific scene by ID
 * @param {number|string} sceneId - Scene ID
 * @returns {Promise<object>} - Scene details
 */
export const getSceneById = async (sceneId) => {
  try {
    if (!sceneId) {
      return responseHandler.handleError(new Error('Scene ID is required'));
    }

    const response = await httpClient.get(sceneEndpoints.get(sceneId));
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('scenes', 'Error fetching scene by ID', { 
      sceneId, 
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Create a new scene
 * @param {object} sceneData - Scene data to create
 * @returns {Promise<object>} - Created scene
 */
export const createScene = async (sceneData) => {
  try {
    // Validate required fields
    if (!sceneData) {
      return responseHandler.handleError(new Error('Scene data is required'));
    }
    
    if (!sceneData.universeId) {
      return responseHandler.handleError(new Error('Universe ID is required for scene creation'));
    }

    const response = await httpClient.post(sceneEndpoints.create, sceneData);
    
    console.log('scenes', 'Scene created successfully');
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('scenes', 'Error creating scene', { error: error.message });
    return responseHandler.handleError(error);
  }
};

/**
 * Update an existing scene
 * @param {number|string} sceneId - Scene ID to update
 * @param {object} sceneData - Updated scene data
 * @returns {Promise<object>} - Updated scene
 */
export const updateScene = async (sceneId, sceneData) => {
  try {
    if (!sceneId) {
      return responseHandler.handleError(new Error('Scene ID is required'));
    }
    
    if (!sceneData) {
      return responseHandler.handleError(new Error('Scene data is required'));
    }

    const response = await httpClient.put(sceneEndpoints.update(sceneId), sceneData);
    
    console.log('scenes', 'Scene updated successfully', { sceneId });
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('scenes', 'Error updating scene', { 
      sceneId, 
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Delete a scene
 * @param {number|string} sceneId - Scene ID to delete
 * @returns {Promise<object>} - Deletion response
 */
export const deleteScene = async (sceneId) => {
  try {
    if (!sceneId) {
      return responseHandler.handleError(new Error('Scene ID is required'));
    }

    const response = await httpClient.delete(sceneEndpoints.delete(sceneId));
    
    console.log('scenes', 'Scene deleted successfully', { sceneId });
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('scenes', 'Error deleting scene', { 
      sceneId, 
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Get scene settings
 * @param {number|string} sceneId - Scene ID
 * @returns {Promise<object>} - Scene settings
 */
export const getSceneSettings = async (sceneId) => {
  try {
    if (!sceneId) {
      return responseHandler.handleError(new Error('Scene ID is required'));
    }

    const response = await httpClient.get(sceneEndpoints.settings(sceneId));
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('scenes', 'Error fetching scene settings', { 
      sceneId, 
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Update scene settings
 * @param {number|string} sceneId - Scene ID
 * @param {object} settings - Scene settings to update
 * @returns {Promise<object>} - Updated scene settings
 */
export const updateSceneSettings = async (sceneId, settings) => {
  try {
    if (!sceneId) {
      return responseHandler.handleError(new Error('Scene ID is required'));
    }
    
    if (!settings) {
      return responseHandler.handleError(new Error('Settings data is required'));
    }

    const response = await httpClient.put(sceneEndpoints.settings(sceneId), settings);
    
    console.log('scenes', 'Scene settings updated successfully', { sceneId });
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('scenes', 'Error updating scene settings', { 
      sceneId, 
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Reorder scenes within a universe
 * @param {number|string} universeId - Universe ID
 * @param {Array} sceneOrder - Array of scene IDs in the desired order
 * @returns {Promise<object>} - Result of the reordering operation
 */
export const reorderScenes = async (universeId, sceneOrder) => {
  try {
    if (!universeId) {
      return responseHandler.handleError(new Error('Universe ID is required'));
    }
    
    if (!Array.isArray(sceneOrder) || sceneOrder.length === 0) {
      return responseHandler.handleError(new Error('Scene order array is required'));
    }

    const response = await httpClient.post(sceneEndpoints.reorder(universeId), { 
      scene_order: sceneOrder 
    });
    
    console.log('scenes', 'Scenes reordered successfully', { universeId });
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('scenes', 'Error reordering scenes', { 
      universeId, 
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Scene service object
 */
export const sceneService = {
  getAllScenes,
  getScenesByUniverse,
  getSceneById,
  createScene,
  updateScene,
  deleteScene,
  getSceneSettings,
  updateSceneSettings,
  reorderScenes
};

export default sceneService;
