import { createAsyncThunk } from '@reduxjs/toolkit';
import { sceneService } from '../../../services';

/**
 * Error handler function for API errors
 */
const handleError = (error) => {
  console.error('API Error:', error);
  return {
    message: error.response?.data?.message || error.message || 'An error occurred',
    status: error.response?.status,
    data: error.response?.data,
  };
};

/**
 * Helper function to normalize scene data (especially date fields)
 */
const normalizeSceneData = (scene) => {
  if (!scene) return null;

  // Ensure dates are strings for consistent handling
  const normalized = {
    ...scene,
    created_at: scene.created_at ? scene.created_at.toString() : null,
    updated_at: scene.updated_at ? scene.updated_at.toString() : null,
  };

  return normalized;
};

/**
 * Helper function to normalize scenes array
 */
const normalizeScenes = (scenes) => {
  if (!scenes || !Array.isArray(scenes)) return [];
  return scenes.map(normalizeSceneData);
};

/**
 * Fetch scenes for a universe
 */
export const fetchScenes = createAsyncThunk(
  'scenes/fetchByUniverse',
  async (universeId, { rejectWithValue, dispatch, getState }) => {
    const timestamp = new Date().toISOString();
    try {
      console.log(`[${timestamp}] REDUX-THUNK: fetchScenes called with universeId=${universeId}`);

      // Input validation
      if (universeId === undefined || universeId === null) {
        throw new Error('Universe ID is required');
      }

      // Convert universeId to number if it's a string
      let numericUniverseId = universeId;
      if (typeof universeId === 'string') {
        numericUniverseId = parseInt(universeId, 10);
      }

      // Check if the ID is valid after conversion
      if (isNaN(numericUniverseId) || numericUniverseId <= 0) {
        throw new Error(`Invalid universe ID: ${universeId}`);
      }

      console.log(`[${timestamp}] REDUX-THUNK: Using validated universeId: ${numericUniverseId}`);

      // First, check if the universe exists to avoid unnecessary API calls for non-existent universes
      try {
        console.log(`[${timestamp}] REDUX-THUNK: Checking if universe ${numericUniverseId} exists`);

        // Import apiClient dynamically to avoid circular imports
        const apiServices = await import('../../../services/api.adapter.mjs');
        const apiClient = apiServices.default;

        const universeResponse = await apiClient.universes.getUniverse(numericUniverseId);
        console.log(`[${timestamp}] REDUX-THUNK: Universe check response:`, universeResponse);

        if (!universeResponse || !universeResponse.data || !universeResponse.data.universe) {
          console.error(`[${timestamp}] REDUX-THUNK: Universe ${numericUniverseId} does not exist or is not accessible`);
          // Return empty scenes array with success status instead of throwing an error
          return {
            universeId: numericUniverseId,
            scenes: [],
            endpointUsed: 'universeNotFound',
          };
        }

        // Check if universe is deleted
        if (universeResponse.data.universe.is_deleted) {
          console.error(`[${timestamp}] REDUX-THUNK: Universe ${numericUniverseId} has been deleted`);
          // Return empty scenes array with success status
          return {
            universeId: numericUniverseId,
            scenes: [],
            endpointUsed: 'universeDeleted',
          };
        }

        console.log(`[${timestamp}] REDUX-THUNK: Universe ${numericUniverseId} exists and is accessible, proceeding to fetch scenes`);
      } catch (universeError) {
        console.warn(`[${timestamp}] REDUX-THUNK: Error checking universe:`, universeError);

        // Only return empty result if we got a 404, otherwise continue with scene fetching
        if (universeError.response && universeError.response.status === 404) {
          console.error(`[${timestamp}] REDUX-THUNK: Universe ${numericUniverseId} does not exist (404 from universe API)`);
          return {
            universeId: numericUniverseId,
            scenes: [],
            endpointUsed: 'universeApiError',
          };
        }
        // For other errors, continue with scene fetching attempt
      }

      let response;
      let scenesData = [];
      let endpointUsed = '';

      try {
        // Using corrected endpoint: http://localhost:5001/api/scenes/universe/{universe_id}
        console.log(`[${timestamp}] REDUX-THUNK: Trying primary endpoint getScenesByUniverse`);
        response = await sceneService.getScenesByUniverse(numericUniverseId);
        console.log(`[${timestamp}] REDUX-THUNK: getScenesByUniverse response:`, response);

        if (response?.data?.scenes) {
          scenesData = response.data.scenes;
          endpointUsed = 'getScenesByUniverse';
        }
      } catch (initialError) {
        console.error(
          `[${timestamp}] REDUX-THUNK: Initial getScenesByUniverse request failed:`,
          initialError
        );

        // Check if the error is due to universe not existing (404)
        if (initialError.response && initialError.response.status === 404) {
          console.error(`[${timestamp}] REDUX-THUNK: Universe ${numericUniverseId} does not exist (404 from scenes API)`);
          return {
            universeId: numericUniverseId,
            scenes: [],
            endpointUsed: 'sceneApiNotFound',
          };
        }

        // If getScenesByUniverse fails, try getAllScenes as fallback
        try {
          console.log(`[${timestamp}] REDUX-THUNK: Trying fallback getAllScenes`);
          response = await sceneService.getAllScenes();
          console.log(`[${timestamp}] REDUX-THUNK: getAllScenes response:`, response);

          if (response?.data?.scenes) {
            // Filter scenes for the specific universe - ensure we're using the numeric value for comparison
            scenesData = response.data.scenes.filter((scene) => {
              // Convert scene.universe_id to a number if it's a string for consistent comparison
              const sceneUniverseId =
                typeof scene.universe_id === 'string'
                  ? parseInt(scene.universe_id, 10)
                  : scene.universe_id;

              return sceneUniverseId === numericUniverseId;
            });
            endpointUsed = 'getAllScenes';
          }
        } catch (fallbackError) {
          console.error(`[${timestamp}] REDUX-THUNK: Fallback request also failed:`, fallbackError);
          throw fallbackError;
        }
      }

      // Normalize the scenes data
      const normalizedScenes = normalizeScenes(scenesData);

      console.log(`[${timestamp}] REDUX-THUNK: Fetch completed successfully`, {
        universeId: numericUniverseId,
        endpointUsed,
        sceneCount: normalizedScenes.length,
      });

      return {
        universeId: numericUniverseId,
        scenes: normalizedScenes,
        endpointUsed,
      };
    } catch (error) {
      console.error(`[${new Date().toISOString()}] REDUX-THUNK: Fetch failed:`, error);
      return rejectWithValue(handleError(error));
    }
  }
);

// Create an alias for fetchScenes to match existing imports
export const fetchScenesForUniverse = fetchScenes;

/**
 * Fetch a single scene by ID
 */
export const fetchSceneById = createAsyncThunk(
  'scenes/fetchSceneById',
  async (sceneId, { rejectWithValue }) => {
    try {
      // Ensure sceneId is a string
      const formattedSceneId = String(sceneId);

      console.log(`fetchSceneById - Fetching scene with ID: ${formattedSceneId}`);

      // Using corrected endpoint: http://localhost:5001/api/scenes/{scene_id}
      const response = await sceneService.getSceneById(formattedSceneId);
      console.log('fetchSceneById - Response:', response);

      // Handle different response formats
      let sceneData;
      if (response.data?.scene) {
        sceneData = response.data.scene;
      } else if (response.data) {
        sceneData = response.data;
      } else {
        throw new Error('Invalid response format from API');
      }

      // Ensure ID is explicitly set
      if (sceneData && !sceneData.id) {
        sceneData.id = formattedSceneId;
      }

      console.log('fetchSceneById - Processed scene data:', sceneData);
      return sceneData;
    } catch (error) {
      console.error('Error fetching scene by ID:', error);

      // Attempt backup method
      try {
        const formattedSceneId = String(sceneId);
        console.log('fetchSceneById - Attempting backup method for scene ID:', formattedSceneId);

        // Try different API endpoints
        let backupResponse;
        try {
          backupResponse = await sceneService.getSceneById(formattedSceneId);
        } catch (err) {
          backupResponse = await sceneService.getSceneById(`/api/scenes/${formattedSceneId}`);
        }

        console.log('fetchSceneById - Backup response:', backupResponse);

        let sceneData;
        if (backupResponse?.data?.scene) {
          sceneData = backupResponse.data.scene;
        } else if (backupResponse?.data) {
          sceneData = backupResponse.data;
        } else {
          throw new Error('Invalid response format from backup API');
        }

        // Ensure ID is explicitly set
        if (sceneData && !sceneData.id) {
          sceneData.id = formattedSceneId;
        }

        console.log('fetchSceneById - Processed backup scene data:', sceneData);
        return sceneData;
      } catch (backupError) {
        console.error('Backup method also failed:', backupError);
        return rejectWithValue(
          error.response?.data?.message || error.message || 'Failed to fetch scene'
        );
      }
    }
  }
);

/**
 * Create a new scene
 */
export const createScene = createAsyncThunk(
  'scenes/createScene',
  async (sceneData, { dispatch, rejectWithValue, getState }) => {
    try {
      // Add timestamp to help track multiple calls
      const timestamp = new Date().toISOString();
      console.log(`THUNK createScene [${timestamp}]: Called with data:`, sceneData);

      // Check if this function was already called in the last second (debounce effect)
      // This helps prevent accidental duplicate scene creation
      const state = getState();
      const lastSceneCreation = state.scenes?.lastCreateAttempt || 0;
      const now = Date.now();

      if (now - lastSceneCreation < 1000) {
        console.warn(`THUNK createScene [${timestamp}]: Potential duplicate call detected (${now - lastSceneCreation}ms after previous call)`);
        dispatch({ type: 'scenes/updateCreateAttempt', payload: now });
      } else {
        dispatch({ type: 'scenes/updateCreateAttempt', payload: now });
      }

      // Validate universe_id is present and valid
      let universeId = sceneData.universe_id || sceneData.universeId;

      if (!universeId) {
        throw new Error('Universe ID is required for scene creation');
      }

      // Convert to number if it's a string
      if (typeof universeId === 'string') {
        universeId = parseInt(universeId, 10);
        if (isNaN(universeId) || universeId <= 0) {
          throw new Error(`Invalid universe ID: ${sceneData.universe_id || sceneData.universeId}`);
        }
      }

      // Format data before sending to API - create a new object to avoid modifying the original
      const formattedData = {
        ...sceneData,
        universe_id: universeId, // Use the validated numeric universeId
        is_deleted: false, // Explicitly set is_deleted to false
      };

      // Make sure name is used instead of title
      if (formattedData.title && !formattedData.name) {
        formattedData.name = formattedData.title;
        delete formattedData.title;
      }

      // Ensure snake_case for fields that require it
      if (formattedData.timeOfDay && !formattedData.time_of_day) {
        formattedData.time_of_day = formattedData.timeOfDay;
        delete formattedData.timeOfDay;
      }

      if (formattedData.characterIds && !formattedData.character_ids) {
        formattedData.character_ids = formattedData.characterIds;
        delete formattedData.characterIds;
      }

      if (formattedData.dateOfScene && !formattedData.date_of_scene) {
        // Handle dateOfScene being either a string or a date object (like from Ant Design DatePicker)
        if (typeof formattedData.dateOfScene === 'object' && formattedData.dateOfScene.format) {
          formattedData.date_of_scene = formattedData.dateOfScene.format('YYYY-MM-DD');
        } else {
          formattedData.date_of_scene = formattedData.dateOfScene;
        }
        delete formattedData.dateOfScene;
      }

      if (formattedData.notesText && !formattedData.notes_text) {
        formattedData.notes_text = formattedData.notesText;
        delete formattedData.notesText;
      }

      // Log the formatted data before sending to the API
      console.log(`THUNK createScene [${timestamp}]: Sending formatted data to API:`, formattedData);

      // Only make the API call once for a given timestamp
      console.log(`THUNK createScene [${timestamp}]: Calling sceneService.createScene once`);
      const response = await sceneService.createScene(formattedData);
      console.log(`THUNK createScene [${timestamp}]: Received API response:`, response);

      // More detailed logging of response format
      console.log(`THUNK createScene [${timestamp}]: Response format analysis:`, {
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        sceneInResponse: !!response.data?.scene,
        responseStatus: response.status,
      });

      // Create a default scene object with the input data as fallback
      // This ensures we have valid data even if the API returns incomplete data
      const defaultSceneData = {
        id: response.data?.scene?.id || response.data?.id || Date.now().toString(), // Use the real ID if available
        name: formattedData.name || 'New Scene',
        description: formattedData.description || '',
        universe_id: formattedData.universe_id,
        scene_type: formattedData.scene_type || 'standard',
        is_active: formattedData.is_active !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false, // Explicitly set is_deleted to false
      };

      // Get scene data from response or use default if missing/incomplete
      let sceneResponseData = response.data?.scene || response.data;

      // If scene data is missing or empty, use our default
      if (!sceneResponseData || Object.keys(sceneResponseData).length === 0) {
        console.warn(
          `THUNK createScene [${timestamp}]: Scene data missing in API response, using default scene data`
        );
        sceneResponseData = defaultSceneData;
      } else {
        // Ensure all required properties are present, use defaults for missing ones
        sceneResponseData = {
          ...defaultSceneData,
          ...sceneResponseData,
          is_deleted: false, // Always ensure is_deleted is false regardless of response
          universe_id: formattedData.universe_id, // Ensure universe_id is included
        };
      }

      console.log(`THUNK createScene [${timestamp}]: Final scene data with is_deleted=false:`, sceneResponseData);

      // Normalize the scene data
      const normalizedSceneData = normalizeSceneData(sceneResponseData);

      // Return the response data early to avoid Redux dispatch timing issues
      const serializedResponse = {
        message: response.data?.message || 'Scene created successfully',
        scene: normalizedSceneData,
        status: response.status || 200,
        timestamp: timestamp, // Add timestamp for correlation
      };

      // Update store if dispatch is available (do this after returning the response)
      if (dispatch) {
        console.log(`THUNK createScene [${timestamp}]: Adding scene to store:`, normalizedSceneData.id);

        // Use a separate function to update the Redux store to avoid race conditions
        setTimeout(() => {
          try {
            // Add to regular scenes array
            dispatch({ type: 'scenes/addScene', payload: normalizedSceneData });

            // Set as current scene in the store
            dispatch({ type: 'scenes/setCurrentScene', payload: normalizedSceneData });

            // Update the universe-specific scenes array if universe_id is available
            if (normalizedSceneData.universe_id) {
              console.log(
                `THUNK createScene [${timestamp}]: Updating universe scenes for universe ${normalizedSceneData.universe_id}`
              );

              // Get current universe scenes from state
              const currentState = getState();
              const currentUniverseScenes =
                currentState.scenes.universeScenes[normalizedSceneData.universe_id] || [];

              // Add the new scene to the universe scenes array
              dispatch({
                type: 'scenes/fetchScenes/fulfilled',
                payload: {
                  scenes: [...currentUniverseScenes, normalizedSceneData],
                  universe_id: normalizedSceneData.universe_id,
                },
                meta: { arg: normalizedSceneData.universe_id },
              });
            }
          } catch (storeError) {
            console.error(`THUNK createScene [${timestamp}]: Error updating Redux store:`, storeError);
          }
        }, 0);
      }

      return serializedResponse;
    } catch (error) {
      console.error('THUNK createScene: Error creating scene:', error);

      if (dispatch) {
        dispatch({
          type: 'scenes/setError',
          payload: error.response?.data?.message || error.message,
        });
      }

      return rejectWithValue(handleError(error));
    }
  }
);

/**
 * Update an existing scene
 */
export const updateScene = createAsyncThunk(
  'scenes/updateScene',
  async (sceneData, { rejectWithValue }) => {
    try {
      console.log('updateScene - Scene data to update:', sceneData);

      if (!sceneData || !sceneData.id) {
        throw new Error('Scene ID is required for updating a scene');
      }

      // Ensure scene ID is properly formatted
      const formattedSceneId = String(sceneData.id);

      // Create a copy of the data with the properly formatted ID
      const formattedSceneData = {
        ...sceneData,
        id: formattedSceneId
      };

      console.log(`updateScene - Updating scene with ID: ${formattedSceneId}`, formattedSceneData);

      // Using correct endpoint: http://localhost:5001/api/scenes/{scene_id}
      const response = await sceneService.updateScene(formattedSceneId, formattedSceneData);
      console.log('updateScene - Response:', response);

      return response.data;
    } catch (error) {
      console.error('Error updating scene:', error);

      // Attempt backup method
      try {
        const formattedSceneId = String(sceneData.id);
        console.log('updateScene - Attempting backup method for scene ID:', formattedSceneId);

        const formattedSceneData = {
          ...sceneData,
          id: formattedSceneId
        };

        // Try alternative endpoint
        const backupResponse = await sceneService.updateScene(`/api/scenes/${formattedSceneId}`, formattedSceneData);
        console.log('updateScene - Backup response:', backupResponse);

        return backupResponse.data;
      } catch (backupError) {
        console.error('Backup method also failed:', backupError);
        return rejectWithValue(
          error.response?.data?.message || error.message || 'Failed to update scene'
        );
      }
    }
  }
);

/**
 * Delete a scene (soft delete)
 */
export const deleteScene = createAsyncThunk(
  'scenes/deleteScene',
  async (sceneId, { rejectWithValue }) => {
    try {
      // Handle both scene object and direct ID
      const formattedSceneId = typeof sceneId === 'object' && sceneId !== null && 'id' in sceneId
        ? String(sceneId.id)
        : String(sceneId);

      console.log(`deleteScene - Deleting scene with ID: ${formattedSceneId}`);

      // Using correct endpoint: http://localhost:5001/api/scenes/{scene_id}
      const response = await sceneService.deleteScene(formattedSceneId);
      console.log('deleteScene - Response:', response);

      return { id: formattedSceneId, ...response.data };
    } catch (error) {
      console.error('Error deleting scene:', error);

      // Attempt backup method
      try {
        // Handle both scene object and direct ID
        const formattedSceneId = typeof sceneId === 'object' && sceneId !== null && 'id' in sceneId
          ? String(sceneId.id)
          : String(sceneId);

        console.log('deleteScene - Attempting backup method for scene ID:', formattedSceneId);

        // Try different methods/endpoints
        let backupResponse;
        try {
          backupResponse = await sceneService.deleteScene(`/api/scenes/${formattedSceneId}`);
        } catch (err) {
          backupResponse = await sceneService.deleteScene(`/api/scenes/${formattedSceneId}`);
        }

        console.log('deleteScene - Backup response:', backupResponse);

        return { id: formattedSceneId, ...backupResponse.data };
      } catch (backupError) {
        console.error('Backup method also failed:', backupError);
        return rejectWithValue(
          error.response?.data?.message || error.message || 'Failed to delete scene'
        );
      }
    }
  }
);

/**
 * Reorder scenes
 */
export const reorderScenes = createAsyncThunk(
  'scenes/reorderScenes',
  async ({ universeId, sceneOrders }, { rejectWithValue }) => {
    try {
      console.log(`Reordering scenes for universe ${universeId}:`, sceneOrders);

      // For simple backend, we can update each scene individually
      const updatePromises = sceneOrders.map(({ id, order }) =>
        sceneService.updateScene(id, { order })
      );

      await Promise.all(updatePromises);

      // Fetch updated scenes
      const response = await sceneService.getScenes(universeId);
      console.log('Got updated scenes after reordering:', response);

      // Extract and normalize the data
      let scenes = [];

      if (response && response.data && Array.isArray(response.data.scenes)) {
        scenes = normalizeScenes(response.data.scenes);
      } else if (response && Array.isArray(response.scenes)) {
        scenes = normalizeScenes(response.scenes);
      } else if (response && typeof response === 'object' && response.status === 'success') {
        scenes = normalizeScenes(response.data?.scenes || []);
      } else if (Array.isArray(response)) {
        scenes = normalizeScenes(response);
      } else {
        console.error('Unexpected scenes response format after reordering:', response);
        scenes = [];
      }

      return { ...response, scenes };
    } catch (error) {
      console.error(`Error reordering scenes for universe ${universeId}:`, error);
      return rejectWithValue(handleError(error));
    }
  }
);

// Fix unused dispatch parameter
export const fetchLocalScenes = () => async (_dispatch, getState) => {
  try {
    // Get scenes from local storage
    const scenes = JSON.parse(localStorage.getItem('scenes') || '[]');
    return scenes;
  } catch (error) {
    console.error('Error fetching scenes from local storage:', error);
    return [];
  }
};

// Fix unused getState parameter
export const deleteSceneLocally = (sceneId) => async (dispatch, _getState) => {
  try {
    console.log('deleteSceneLocally thunk - Deleting scene with ID:', sceneId);

    // Get scenes from local storage
    const scenes = JSON.parse(localStorage.getItem('scenes') || '[]');

    // Filter out the scene to delete
    const updatedScenes = scenes.filter((scene) => scene.id !== sceneId);

    // Save the updated scenes back to localStorage
    localStorage.setItem('scenes', JSON.stringify(updatedScenes));

    // Dispatch the action to update Redux state
    dispatch({
      type: 'scenes/deleteScene/fulfilled',
      payload: { id: sceneId },
    });

    console.log('deleteSceneLocally thunk - Scene deleted successfully');
    return { success: true, id: sceneId };
  } catch (error) {
    console.error('Error deleting scene locally:', error);
    return { success: false, error };
  }
};

/**
 * Create a new scene and ensure UI is updated
 */
export const createSceneAndRefresh = createAsyncThunk(
  'scenes/createSceneAndRefresh',
  async (sceneData, { dispatch, rejectWithValue }) => {
    try {
      console.log('THUNK createSceneAndRefresh: Called with data:', sceneData);

      // First create the scene
      const createResult = await dispatch(createScene(sceneData)).unwrap();
      console.log('THUNK createSceneAndRefresh: Scene created successfully:', createResult);

      // Extract universe_id to refresh the scenes list
      const universeId = sceneData.universe_id || sceneData.universeId;

      if (!universeId) {
        console.warn('THUNK createSceneAndRefresh: No universe_id found in scene data, cannot refresh');
        return createResult;
      }

      // Immediately refresh the scenes list to update the UI
      console.log(`THUNK createSceneAndRefresh: Refreshing scenes for universe ${universeId}`);
      await dispatch(fetchScenesForUniverse(universeId)).unwrap();

      return createResult;
    } catch (error) {
      console.error('THUNK createSceneAndRefresh: Error:', error);
      return rejectWithValue(handleError(error));
    }
  }
);

/**
 * Update an existing scene and ensure UI is updated
 */
export const updateSceneAndRefresh = createAsyncThunk(
  'scenes/updateSceneAndRefresh',
  async ({ sceneId, sceneData }, { dispatch, rejectWithValue }) => {
    try {
      console.log('THUNK updateSceneAndRefresh: Called with data:', { sceneId, sceneData });

      // First update the scene
      const updateResult = await dispatch(updateScene(sceneData)).unwrap();
      console.log('THUNK updateSceneAndRefresh: Scene updated successfully:', updateResult);

      // Extract universe_id to refresh the scenes list
      const universeId = sceneData.universe_id || sceneData.universeId;

      if (!universeId) {
        console.warn('THUNK updateSceneAndRefresh: No universe_id found in scene data, cannot refresh');
        return updateResult;
      }

      // Immediately refresh the scenes list to update the UI
      console.log(`THUNK updateSceneAndRefresh: Refreshing scenes for universe ${universeId}`);
      await dispatch(fetchScenesForUniverse(universeId)).unwrap();

      return updateResult;
    } catch (error) {
      console.error('THUNK updateSceneAndRefresh: Error:', error);
      return rejectWithValue(handleError(error));
    }
  }
);

/**
 * Delete a scene and ensure UI is updated
 */
export const deleteSceneAndRefresh = createAsyncThunk(
  'scenes/deleteSceneAndRefresh',
  async ({ sceneId, universeId }, { dispatch, rejectWithValue }) => {
    try {
      console.log('THUNK deleteSceneAndRefresh: Called with data:', { sceneId, universeId });

      // First delete the scene
      const deleteResult = await dispatch(deleteScene(sceneId)).unwrap();
      console.log('THUNK deleteSceneAndRefresh: Scene deleted successfully:', deleteResult);

      // If we don't have a universe ID in the parameters, try to get it from the response
      const effectiveUniverseId = universeId || deleteResult.universe_id;

      if (!effectiveUniverseId) {
        console.warn('THUNK deleteSceneAndRefresh: No universe_id found, cannot refresh');
        return deleteResult;
      }

      // Immediately refresh the scenes list to update the UI
      console.log(`THUNK deleteSceneAndRefresh: Refreshing scenes for universe ${effectiveUniverseId}`);
      await dispatch(fetchScenesForUniverse(effectiveUniverseId)).unwrap();

      return deleteResult;
    } catch (error) {
      console.error('THUNK deleteSceneAndRefresh: Error:', error);
      return rejectWithValue(handleError(error));
    }
  }
);
