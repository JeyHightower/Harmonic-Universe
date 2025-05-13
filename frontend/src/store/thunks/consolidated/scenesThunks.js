import { createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../../services/api';
import { addLocallyCreatedScene } from '../../slices/scenesSlice';

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
 * Helper function to normalize scene IDs
 */
const normalizeSceneId = (scene) => {
  if (scene && scene.id) {
    if (typeof scene.id === 'string' && /^\d+$/.test(scene.id)) {
      scene.id = parseInt(scene.id, 10);
    }
  }
  return scene;
};

/**
 * Helper function to normalize scenes array
 */
const normalizeScenes = (scenes) => {
  if (!scenes || !Array.isArray(scenes)) return [];
  return scenes.map(normalizeSceneId);
};

/**
 * Fetch scenes for a universe
 */
export const fetchScenes = createAsyncThunk('scenes/fetchScenes', async (universeId) => {
  const response = await fetch(`/api/universes/${universeId}/scenes`);
  if (!response.ok) {
    throw new Error('Failed to fetch scenes');
  }
  return response.json();
});

// Create an alias for fetchScenes to match existing imports
export const fetchScenesForUniverse = fetchScenes;

/**
 * Fetch a single scene by ID
 */
export const fetchSceneById = createAsyncThunk(
  'scenes/fetchSceneById',
  async (sceneId, { rejectWithValue, getState }) => {
    try {
      console.log('THUNK fetchSceneById: Called with ID:', sceneId);

      // Input validation
      if (!sceneId) {
        throw new Error('Scene ID is required');
      }

      // First check if we already have this scene in the Redux store
      const state = getState();
      const existingScene = state.scenes?.scenes?.find(
        (scene) => scene.id === sceneId || scene.id === Number(sceneId)
      );

      // If we found the scene in the store and it's not marked as deleted, use it
      if (existingScene && existingScene.is_deleted !== true) {
        console.log(
          'THUNK fetchSceneById: Found scene in Redux store, using cached data:',
          existingScene
        );

        // Return the existing scene data in the expected format
        return {
          message: 'Scene fetched from store successfully',
          scene: normalizeSceneData({
            ...existingScene,
            is_deleted: false, // Ensure is_deleted is explicitly false
          }),
          status: 200,
          fromStore: true, // Flag to indicate this came from store
        };
      }

      // Check the currentScene as well
      const currentScene = state.scenes?.currentScene;
      if (
        currentScene &&
        (currentScene.id === sceneId || currentScene.id === Number(sceneId)) &&
        currentScene.is_deleted !== true
      ) {
        console.log('THUNK fetchSceneById: Using current scene from Redux store:', currentScene);

        return {
          message: 'Scene fetched from current scene successfully',
          scene: normalizeSceneData({
            ...currentScene,
            is_deleted: false, // Ensure is_deleted is explicitly false
          }),
          status: 200,
          fromStore: true, // Flag to indicate this came from store
        };
      }

      // If we don't have the scene in the store, make the API call
      console.log('THUNK fetchSceneById: Scene not found in store, fetching from API');

      // Format sceneId to ensure consistency - try to parse as number if it's a string
      let formattedSceneId = sceneId;
      if (typeof sceneId === 'string' && /^\d+$/.test(sceneId)) {
        formattedSceneId = parseInt(sceneId, 10);
        console.log(
          `THUNK fetchSceneById: Converted string ID to number: ${sceneId} -> ${formattedSceneId}`
        );
      }

      // Make API call
      try {
        const response = await apiClient.getScene(formattedSceneId);
        console.log('THUNK fetchSceneById: Received API response:', response);

        // Check for valid scene data
        if (!response.data || !response.data.scene) {
          throw new Error('Invalid response format - missing scene data');
        }

        // Normalize response to ensure consistent structure
        const sceneData = response.data.scene;

        // Ensure is_deleted is explicitly set to false
        const normalizedSceneData = normalizeSceneData({
          ...sceneData,
          is_deleted: false,
        });

        // Return serializable data
        const serializedResponse = {
          message: response.data?.message || 'Scene fetched successfully',
          scene: normalizedSceneData,
          status: response.status || 200,
        };

        return serializedResponse;
      } catch (apiError) {
        // Handle specific API errors
        console.error('THUNK fetchSceneById: API Error:', apiError);

        // Provide a specific error message for 404 (not found)
        if (apiError.response?.status === 404) {
          return rejectWithValue({
            message: `Scene with ID ${sceneId} not found. It may have been deleted or doesn't exist.`,
            status: 404,
          });
        }

        // Handle other API errors
        throw apiError;
      }
    } catch (error) {
      console.error('THUNK fetchSceneById: Error fetching scene:', error);

      // Format error for consistent handling
      return rejectWithValue(handleError(error));
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
      console.log('THUNK createScene: Called with data:', sceneData);

      // Format data before sending to API
      const formattedData = {
        ...sceneData,
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
        formattedData.date_of_scene = formattedData.dateOfScene;
        delete formattedData.dateOfScene;
      }

      if (formattedData.notesText && !formattedData.notes_text) {
        formattedData.notes_text = formattedData.notesText;
        delete formattedData.notesText;
      }

      // Log the formatted data before sending to the API
      console.log('THUNK createScene: Sending formatted data to API:', formattedData);

      // Call the API to create the scene
      const response = await apiClient.createScene(formattedData);
      console.log('THUNK createScene: Received API response:', response);

      // More detailed logging of response format
      console.log('THUNK createScene: Response format analysis:', {
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        sceneInResponse: !!response.data?.scene,
        responseStatus: response.status,
      });

      // Create a default scene object with the input data as fallback
      // This ensures we have valid data even if the API returns incomplete data
      const defaultSceneData = {
        // Generate a temporary ID that fits within PostgreSQL integer limits
        // Take last 7 digits of timestamp and add small random number for uniqueness
        id:
          response.data?.scene?.id ||
          parseInt(
            Date.now().toString().slice(-7) +
              Math.floor(Math.random() * 100)
                .toString()
                .padStart(2, '0')
          ),
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
          'THUNK createScene: Scene data missing in API response, using default scene data'
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

      console.log('THUNK createScene: Final scene data with is_deleted=false:', sceneResponseData);

      // Normalize the scene data
      const normalizedSceneData = normalizeSceneData(sceneResponseData);

      // Update direct store if needed - ensure we dispatch to all relevant parts of the store
      if (dispatch) {
        console.log('THUNK createScene: Adding scene to store:', normalizedSceneData.id);

        // Add to regular scenes array
        dispatch({ type: 'scenes/addScene', payload: normalizedSceneData });

        // Also add to locally created scenes for persistence
        dispatch(addLocallyCreatedScene(normalizedSceneData));

        // Force update to current scene in the store
        dispatch({ type: 'scenes/setCurrentScene', payload: normalizedSceneData });

        // Update the universe-specific scenes array
        if (normalizedSceneData.universe_id) {
          console.log(
            `THUNK createScene: Fetching scenes for universe ${normalizedSceneData.universe_id} to update store`
          );

          // First, add the scene directly to the universe scenes array for immediate UI update
          const state = getState();
          const currentUniverseScenes =
            state.scenes.universeScenes[normalizedSceneData.universe_id] || [];

          dispatch({
            type: 'scenes/fetchScenes/fulfilled',
            payload: {
              scenes: [...currentUniverseScenes, normalizedSceneData],
              universe_id: normalizedSceneData.universe_id,
            },
            meta: { arg: normalizedSceneData.universe_id },
          });

          // Then fetch from server to ensure we have the latest data
          dispatch(fetchScenes(normalizedSceneData.universe_id));
        }
      }

      // Return serializable data
      const serializedResponse = {
        message: response.data?.message || 'Scene created successfully',
        scene: normalizedSceneData,
        status: response.status || 200,
      };

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
  async (sceneData, { dispatch, rejectWithValue, getState }) => {
    try {
      console.log('THUNK updateScene: Called with data:', sceneData);

      // Validation
      if (!sceneData || !sceneData.id) {
        throw new Error('Scene ID is required for updating a scene');
      }

      // Format data before sending to API
      const formattedData = {
        ...sceneData,
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
        formattedData.date_of_scene = formattedData.dateOfScene;
        delete formattedData.dateOfScene;
      }

      if (formattedData.notesText && !formattedData.notes_text) {
        formattedData.notes_text = formattedData.notesText;
        delete formattedData.notesText;
      }

      // Extract scene ID and remove from update payload
      const sceneId = formattedData.id;
      const updatePayload = { ...formattedData };
      delete updatePayload.id; // Remove ID from update data

      console.log(
        `THUNK updateScene: Updating scene ${sceneId} with formatted data:`,
        updatePayload
      );

      // Call API
      const response = await apiClient.updateScene(sceneId, updatePayload);
      console.log('THUNK updateScene: Received API response:', response);

      // Check for valid scene data
      if (!response.data || !response.data.scene) {
        throw new Error('Invalid response format - missing scene data');
      }

      // Get scene data from response
      const responseSceneData = response.data.scene;

      // Ensure is_deleted is explicitly false
      const normalizedSceneData = normalizeSceneData({
        ...responseSceneData,
        is_deleted: false,
      });

      console.log('THUNK updateScene: Normalized scene data:', normalizedSceneData);

      // Refresh universe scenes if scene has a universe_id
      if (normalizedSceneData.universe_id) {
        console.log(
          `THUNK updateScene: Refreshing scenes for universe ${normalizedSceneData.universe_id}`
        );
        dispatch(fetchScenes(normalizedSceneData.universe_id));
      }

      // Return serializable data
      const serializedResponse = {
        message: response.data?.message || 'Scene updated successfully',
        scene: normalizedSceneData,
        status: response.status || 200,
      };

      return serializedResponse;
    } catch (error) {
      console.error('THUNK updateScene: Error updating scene:', error);
      return rejectWithValue(handleError(error));
    }
  }
);

/**
 * Delete a scene (soft delete)
 */
export const deleteScene = createAsyncThunk(
  'scenes/deleteScene',
  async (sceneId, { dispatch, rejectWithValue, getState }) => {
    try {
      console.log('THUNK deleteScene: Called with ID:', sceneId);

      // Input validation
      if (!sceneId) {
        throw new Error('Scene ID is required for deletion');
      }

      // Get scene data before deletion to know which universe to refresh
      let universeId = null;
      try {
        const state = getState();
        const scene = state.scenes.scenes.find((s) => s.id === sceneId);
        if (scene) {
          universeId = scene.universe_id;
          console.log(`THUNK deleteScene: Found universe_id ${universeId} for scene ${sceneId}`);
        }
      } catch (e) {
        console.warn('THUNK deleteScene: Error getting universe_id from state:', e);
      }

      // Call API to delete scene
      const response = await apiClient.deleteScene(sceneId);
      console.log('THUNK deleteScene: Received API response:', response);

      // Get the scene ID from the response if available, or use the input ID
      const deletedSceneId = response.data?.id || sceneId;

      // If we have a universe ID, refresh the scenes for that universe
      if (universeId) {
        console.log(`THUNK deleteScene: Refreshing scenes for universe ${universeId}`);
        dispatch(fetchScenes(universeId));
      }

      // Return serializable data
      const serializedResponse = {
        message: response.data?.message || 'Scene deleted successfully',
        id: deletedSceneId,
        universe_id: universeId,
        status: response.status || 200,
      };

      return serializedResponse;
    } catch (error) {
      console.error('THUNK deleteScene: Error deleting scene:', error);
      return rejectWithValue(handleError(error));
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
        apiClient.updateScene(id, { order })
      );

      await Promise.all(updatePromises);

      // Fetch updated scenes
      const response = await apiClient.getScenes(universeId);
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
