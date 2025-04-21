/**
 * Scene Service
 * Handles operations related to scenes in the application
 */

import { sceneEndpoints } from './endpoints';
import { httpClient } from './http-client';
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
    // Validate universeId
    if (universeId === undefined || universeId === null) {
      console.error('getScenesByUniverse: Universe ID is required but was', universeId);
      return responseHandler.handleError(new Error('Universe ID is required'));
    }

    // If universeId is a string, convert it to a number
    let validatedId = universeId;
    if (typeof universeId === 'string') {
      validatedId = parseInt(universeId, 10);
      if (isNaN(validatedId)) {
        console.error(`Invalid universe ID format: ${universeId} - cannot be parsed to a number`);
        return responseHandler.handleError(new Error(`Invalid universe ID format: ${universeId}`));
      }
    }

    // Check if ID is positive
    if (validatedId <= 0) {
      console.error(
        `Universe ID must be a positive number: ${universeId}, received: ${validatedId}`
      );
      return responseHandler.handleError(
        new Error(`Universe ID must be a positive number: ${universeId}`)
      );
    }

    console.log('scenes.service: Making API call to get scenes for universe:', validatedId);

    // First check if the universe exists
    try {
      // Import universeService using dynamic import to avoid circular dependency
      const { default: apiAdapter } = await import('./api.adapter.mjs');

      console.log('scenes.service: Checking if universe exists:', validatedId);
      const universeResponse = await apiAdapter.universes.getUniverse(validatedId);

      if (!universeResponse || !universeResponse.data || !universeResponse.data.universe) {
        console.error(`Universe with ID ${validatedId} does not exist or is not accessible`);
        return responseHandler.handleSuccess({
          data: { scenes: [] },
          status: 200,
          statusText: 'OK (universe not found but returning empty array for graceful handling)',
        });
      }

      // Check if universe is deleted
      if (universeResponse.data.universe.is_deleted) {
        console.error(`Universe with ID ${validatedId} has been deleted`);
        return responseHandler.handleSuccess({
          data: { scenes: [] },
          status: 200,
          statusText: 'OK (universe is deleted but returning empty array for graceful handling)',
        });
      }

      console.log(`Universe with ID ${validatedId} exists and is accessible, proceeding to fetch scenes`);
    } catch (universeError) {
      // If we can't verify the universe, log but continue to try fetching scenes
      console.warn(`Could not verify if universe ${validatedId} exists:`, universeError);
      // If we got a 404, that means the universe doesn't exist
      if (universeError.response && universeError.response.status === 404) {
        console.error(`Universe with ID ${validatedId} does not exist (404 from universe API)`);
        return responseHandler.handleSuccess({
          data: { scenes: [] },
          status: 200,
          statusText: 'OK (universe not found but returning empty array for graceful handling)',
        });
      }
    }

    // Try the primary endpoint first (byUniverse)
    try {
      const response = await httpClient.get(sceneEndpoints.byUniverse(validatedId));

      console.log('scenes.service: Got API response for getScenesByUniverse (primary endpoint):', {
        status: response.status,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        sceneCount: response.data?.scenes?.length || 0,
      });

      return responseHandler.handleSuccess(response);
    } catch (primaryError) {
      // If primary endpoint fails with 404, try the alternative endpoint
      if (primaryError.response && primaryError.response.status === 404) {
        console.log('Primary endpoint returned 404, trying alternative endpoint forUniverse');

        try {
          // Try the alternative endpoint (forUniverse)
          const altResponse = await httpClient.get(sceneEndpoints.forUniverse(validatedId));

          console.log('scenes.service: Got API response from alternative endpoint:', {
            status: altResponse.status,
            hasData: !!altResponse.data,
            dataKeys: altResponse.data ? Object.keys(altResponse.data) : [],
            sceneCount: altResponse.data?.scenes?.length || 0,
          });

          return responseHandler.handleSuccess(altResponse);
        } catch (altError) {
          // If both endpoints fail, return empty scenes array instead of an error
          console.log('Both endpoints failed, returning empty array for graceful recovery');
          return responseHandler.handleSuccess({
            data: { scenes: [] },
            status: 200,
            statusText: 'OK (recovered from errors)',
          });
        }
      }

      // If error is not 404, check if we should recover or propagate
      console.error('Primary endpoint failed with non-404 error:', primaryError.message);

      // Return empty scenes array instead of error for better UX
      return responseHandler.handleSuccess({
        data: { scenes: [] },
        status: 200,
        statusText: 'OK (recovered from non-404 error)',
      });
    }
  } catch (error) {
    console.log('scenes', 'Error fetching universe scenes', {
      universeId,
      error: error.message,
    });

    // Return empty scenes array for graceful error recovery
    return responseHandler.handleSuccess({
      data: { scenes: [] },
      status: 200,
      statusText: 'OK (recovered from general error)',
    });
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

    console.log('scene.service: Fetching scene by ID:', sceneId);
    const response = await httpClient.get(sceneEndpoints.get(sceneId));

    // Log the response to debug
    console.log('scene.service: Raw response from getSceneById:', response);

    // Check if response has expected format
    if (!response) {
      console.warn('scene.service: Empty response from API');
      return responseHandler.handleError(new Error('Empty response from API'));
    }

    if (!response.data) {
      console.warn('scene.service: Response missing data property');
      return responseHandler.handleError(new Error('Invalid response format - missing data'));
    }

    // Normalize the response structure to ensure consistent format
    let normalizedResponse = { ...response };

    // If scene is directly in data, wrap it for consistent response format
    if (response.data && !response.data.scene && typeof response.data === 'object') {
      console.log('scene.service: Normalizing response format to include scene property');
      normalizedResponse = {
        ...response,
        data: {
          message: 'Scene retrieved successfully',
          scene: response.data,
        },
      };
    }

    // Ensure scene data is clean
    if (normalizedResponse.data?.scene) {
      // Make sure is_deleted is explicitly set to false for consistency
      normalizedResponse.data.scene.is_deleted = false;
    }

    return responseHandler.handleSuccess(normalizedResponse);
  } catch (error) {
    console.log('scenes', 'Error fetching scene by ID', {
      sceneId,
      error: error.message,
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Create a new scene
 * @param {object|number|string} param1 - Either scene data object or universe ID
 * @param {object} [param2] - Scene data object (if param1 is universeId)
 * @returns {Promise<object>} - Created scene
 */
export const createScene = async (param1, param2) => {
  try {
    let sceneData;

    // Handle both function signatures:
    // 1. createScene(sceneData)
    // 2. createScene(universeId, sceneData)
    if (param2) {
      // Function was called with (universeId, sceneData)
      const universeId = param1;
      sceneData = { ...param2, universe_id: universeId };
      console.log('scenes', 'Creating scene with universeId param:', universeId);
    } else {
      // Function was called with just (sceneData)
      sceneData = param1;
    }

    // Validate required fields
    if (!sceneData) {
      return responseHandler.handleError(new Error('Scene data is required'));
    }

    // Ensure universe_id is set
    if (!sceneData.universe_id) {
      if (sceneData.universeId) {
        // Convert camelCase to snake_case
        sceneData.universe_id = sceneData.universeId;
        delete sceneData.universeId;
      } else {
        return responseHandler.handleError(new Error('Universe ID is required for scene creation'));
      }
    }

    console.log('scenes', 'Creating scene with data:', sceneData);
    const response = await httpClient.post(sceneEndpoints.create, sceneData);

    console.log('scenes', 'Scene created successfully:', response.data);
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

    console.log('scenes', 'Updating scene with data:', { sceneId, sceneData });
    const response = await httpClient.put(sceneEndpoints.update(sceneId), sceneData);

    // Log the response to debug
    console.log('scenes', 'Raw response from updateScene:', response);

    // Check if response has expected format
    if (!response) {
      console.warn('scene.service: Empty response from API');
      return responseHandler.handleError(new Error('Empty response from API'));
    }

    // Normalize the response structure to ensure consistent format
    let normalizedResponse = { ...response };

    // If scene is directly in data, wrap it for consistent response format
    if (response.data && !response.data.scene && typeof response.data === 'object') {
      console.log('scene.service: Normalizing response format to include scene property');
      normalizedResponse = {
        ...response,
        data: {
          message: 'Scene updated successfully',
          scene: response.data,
        },
      };
    }

    // Ensure scene data is clean
    if (normalizedResponse.data?.scene) {
      // Make sure is_deleted is explicitly set to false for consistency
      normalizedResponse.data.scene.is_deleted = false;
    }

    console.log('scenes', 'Scene updated successfully with normalized response', {
      sceneId,
      responseData: normalizedResponse.data,
    });

    return responseHandler.handleSuccess(normalizedResponse);
  } catch (error) {
    console.log('scenes', 'Error updating scene', {
      sceneId,
      error: error.message,
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
      error: error.message,
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
      error: error.message,
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
      error: error.message,
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
      scene_order: sceneOrder,
    });

    console.log('scenes', 'Scenes reordered successfully', { universeId });
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('scenes', 'Error reordering scenes', {
      universeId,
      error: error.message,
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
  reorderScenes,
};

export default sceneService;
