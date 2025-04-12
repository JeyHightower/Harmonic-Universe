import { createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../../services/api";
import {
  addLocallyCreatedScene
} from "../../slices/scenesSlice";

/**
 * Error handler function for API errors
 */
const handleError = (error) => {
  console.error("API Error:", error);
  return {
    message:
      error.response?.data?.message || error.message || "An error occurred",
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
  "scenes/fetchScenes",
  async (universeId, { rejectWithValue }) => {
    try {
      // Add request timestamp for easier debugging
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] REDUX-THUNK: fetchScenes for universe ${universeId}`);

      // Try the primary API endpoint first
      let response;
      let scenesData = [];
      let endpointUsed = '';

      try {
        console.log(`[${timestamp}] REDUX-THUNK: Trying primary endpoint getScenes`);
        response = await apiClient.getScenes(universeId);
        console.log(`[${timestamp}] REDUX-THUNK: getScenes response:`, response);

        if (response?.data?.scenes) {
          scenesData = response.data.scenes;
          endpointUsed = 'getScenes';
        }
      } catch (initialError) {
        console.error(`[${timestamp}] REDUX-THUNK: Initial getScenes request failed:`, initialError);

        // If getScenes fails, try getUniverseScenes as fallback
        try {
          console.log(`[${timestamp}] REDUX-THUNK: Trying fallback getUniverseScenes`);
          response = await apiClient.getUniverseScenes(universeId);
          console.log(`[${timestamp}] REDUX-THUNK: getUniverseScenes response:`, response);

          if (response?.data?.scenes) {
            scenesData = response.data.scenes;
            endpointUsed = 'getUniverseScenes';
          }
        } catch (fallbackError) {
          console.error(`[${timestamp}] REDUX-THUNK: Fallback request also failed:`, fallbackError);

          // If both fail, try direct fetch as last resort
          try {
            console.log(`[${timestamp}] REDUX-THUNK: Trying direct fetch as last resort`);

            // Create headers with authentication token
            const headers = {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            };

            const token = localStorage.getItem('token');
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }

            // Try each direct fetch endpoint
            const endpoints = [
              `/api/scenes?universe_id=${universeId}`,
              `/api/scenes/universe/${universeId}`,
              `/api/universes/${universeId}/scenes`
            ];

            let fetchSuccess = false;

            for (const endpoint of endpoints) {
              if (fetchSuccess) break;

              try {
                console.log(`[${timestamp}] REDUX-THUNK: Trying direct fetch to ${endpoint}`);
                const fetchResponse = await fetch(endpoint, {
                  method: 'GET',
                  headers,
                  credentials: 'include'
                });

                if (!fetchResponse.ok) {
                  console.log(`[${timestamp}] REDUX-THUNK: Fetch returned status ${fetchResponse.status}`);
                  continue;
                }

                const data = await fetchResponse.json();
                console.log(`[${timestamp}] REDUX-THUNK: Direct fetch response:`, data);

                // Extract scenes from the response
                if (Array.isArray(data)) {
                  scenesData = data;
                  fetchSuccess = true;
                  endpointUsed = `direct-fetch-array:${endpoint}`;
                } else if (data.scenes && Array.isArray(data.scenes)) {
                  scenesData = data.scenes;
                  fetchSuccess = true;
                  endpointUsed = `direct-fetch-scenes:${endpoint}`;
                } else if (data.data && Array.isArray(data.data)) {
                  scenesData = data.data;
                  fetchSuccess = true;
                  endpointUsed = `direct-fetch-data:${endpoint}`;
                }
              } catch (fetchError) {
                console.error(`[${timestamp}] REDUX-THUNK: Fetch error for ${endpoint}:`, fetchError);
              }
            }

            if (!fetchSuccess) {
              console.error(`[${timestamp}] REDUX-THUNK: All fetch attempts failed`);
              // Return empty array instead of throwing to prevent UI errors
              return {
                scenes: [],
                message: 'Failed to get scenes from any endpoint',
                universe_id: universeId
              };
            }
          } catch (directFetchError) {
            console.error(`[${timestamp}] REDUX-THUNK: All methods failed:`, directFetchError);
            // Return empty array instead of throwing to prevent UI errors
            return {
              scenes: [],
              message: 'Failed to get scenes',
              universe_id: universeId
            };
          }
        }
      }

      console.log(`[${timestamp}] REDUX-THUNK: Successfully fetched ${scenesData.length} scenes using ${endpointUsed}`);

      // Return the scenes array wrapped in an object
      return {
        scenes: scenesData,
        message: 'Scenes retrieved successfully',
        universe_id: universeId,
        _debug: { timestamp, endpoint: endpointUsed }
      };
    } catch (error) {
      console.error("Error in fetchScenes:", error);
      return rejectWithValue(error.message);
    }
  }
);

// Create an alias for fetchScenes to match existing imports
export const fetchScenesForUniverse = fetchScenes;

/**
 * Fetch a single scene by ID
 */
export const fetchSceneById = createAsyncThunk(
  "scenes/fetchById",
  async (sceneId, { rejectWithValue, _dispatch, _getState }) => {
    try {
      console.log("THUNK fetchSceneById: Called with ID:", sceneId);

      // Input validation
      if (!sceneId) {
        throw new Error("Scene ID is required");
      }

      // Make API call
      const response = await apiClient.getScene(sceneId);
      console.log("THUNK fetchSceneById: Received API response:", response);

      // Check for valid scene data
      if (!response.data || !response.data.scene) {
        throw new Error("Invalid response format - missing scene data");
      }

      // Normalize response to ensure consistent structure
      const sceneData = response.data.scene;

      // Ensure is_deleted is explicitly set to false
      const normalizedSceneData = normalizeSceneData({
        ...sceneData,
        is_deleted: false
      });

      // Return serializable data
      const serializedResponse = {
        message: response.data?.message || "Scene fetched successfully",
        scene: normalizedSceneData,
        status: response.status || 200
      };

      return serializedResponse;
    } catch (error) {
      console.error("THUNK fetchSceneById: Error fetching scene:", error);
      return rejectWithValue(handleError(error));
    }
  }
);

/**
 * Create a new scene
 */
export const createScene = createAsyncThunk(
  "scenes/createScene",
  async (sceneData, { dispatch, rejectWithValue, getState }) => {
    try {
      console.log("THUNK createScene: Called with data:", sceneData);

      // Format data before sending to API
      const formattedData = {
        ...sceneData,
        is_deleted: false // Explicitly set is_deleted to false
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
      console.log("THUNK createScene: Sending formatted data to API:", formattedData);

      // Call the API to create the scene
      const response = await apiClient.createScene(formattedData);
      console.log("THUNK createScene: Received API response:", response);

      // More detailed logging of response format
      console.log("THUNK createScene: Response format analysis:", {
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        sceneInResponse: !!response.data?.scene,
        responseStatus: response.status
      });

      // Create a default scene object with the input data as fallback
      // This ensures we have valid data even if the API returns incomplete data
      const defaultSceneData = {
        id: response.data?.scene?.id || Date.now().toString(), // Use the real ID if available
        name: formattedData.name || "New Scene",
        description: formattedData.description || "",
        universe_id: formattedData.universe_id,
        scene_type: formattedData.scene_type || "standard",
        is_active: formattedData.is_active !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false // Explicitly set is_deleted to false
      };

      // Get scene data from response or use default if missing/incomplete
      let sceneResponseData = response.data?.scene || response.data;

      // If scene data is missing or empty, use our default
      if (!sceneResponseData || Object.keys(sceneResponseData).length === 0) {
        console.warn("THUNK createScene: Scene data missing in API response, using default scene data");
        sceneResponseData = defaultSceneData;
      } else {
        // Ensure all required properties are present, use defaults for missing ones
        sceneResponseData = {
          ...defaultSceneData,
          ...sceneResponseData,
          is_deleted: false, // Always ensure is_deleted is false regardless of response
          universe_id: formattedData.universe_id // Ensure universe_id is included
        };
      }

      console.log("THUNK createScene: Final scene data with is_deleted=false:", sceneResponseData);

      // Normalize the scene data
      const normalizedSceneData = normalizeSceneData(sceneResponseData);

      // Update direct store if needed - ensure we dispatch to all relevant parts of the store
      if (dispatch) {
        console.log("THUNK createScene: Adding scene to store:", normalizedSceneData.id);

        // Add to regular scenes array
        dispatch({ type: 'scenes/addScene', payload: normalizedSceneData });

        // Also add to locally created scenes for persistence
        dispatch(addLocallyCreatedScene(normalizedSceneData));

        // Force update to current scene in the store
        dispatch({ type: 'scenes/setCurrentScene', payload: normalizedSceneData });

        // Update the universe-specific scenes array
        if (normalizedSceneData.universe_id) {
          console.log(`THUNK createScene: Fetching scenes for universe ${normalizedSceneData.universe_id} to update store`);

          // First, add the scene directly to the universe scenes array for immediate UI update
          const state = getState();
          const currentUniverseScenes = state.scenes.universeScenes[normalizedSceneData.universe_id] || [];

          dispatch({
            type: 'scenes/fetchScenes/fulfilled',
            payload: {
              scenes: [...currentUniverseScenes, normalizedSceneData],
              universe_id: normalizedSceneData.universe_id
            },
            meta: { arg: normalizedSceneData.universe_id }
          });

          // Then fetch from server to ensure we have the latest data
          dispatch(fetchScenes(normalizedSceneData.universe_id));
        }
      }

      // Return serializable data
      const serializedResponse = {
        message: response.data?.message || "Scene created successfully",
        scene: normalizedSceneData,
        status: response.status || 200
      };

      return serializedResponse;
    } catch (error) {
      console.error("THUNK createScene: Error creating scene:", error);

      if (dispatch) {
        dispatch({ type: 'scenes/setError', payload: error.response?.data?.message || error.message });
      }

      return rejectWithValue(handleError(error));
    }
  }
);

/**
 * Update an existing scene
 */
export const updateScene = createAsyncThunk(
  "scenes/updateScene",
  async (sceneData, { dispatch, rejectWithValue, _getState }) => {
    try {
      console.log("THUNK updateScene: Called with data:", sceneData);

      // Validation
      if (!sceneData || !sceneData.id) {
        throw new Error("Scene ID is required for updating a scene");
      }

      // Format data before sending to API
      const formattedData = {
        ...sceneData,
        is_deleted: false // Explicitly set is_deleted to false
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

      console.log(`THUNK updateScene: Updating scene ${sceneId} with formatted data:`, updatePayload);

      // Call API
      const response = await apiClient.updateScene(sceneId, updatePayload);
      console.log("THUNK updateScene: Received API response:", response);

      // Check for valid scene data
      if (!response.data || !response.data.scene) {
        throw new Error("Invalid response format - missing scene data");
      }

      // Get scene data from response
      const responseSceneData = response.data.scene;

      // Ensure is_deleted is explicitly false
      const normalizedSceneData = normalizeSceneData({
        ...responseSceneData,
        is_deleted: false
      });

      console.log("THUNK updateScene: Normalized scene data:", normalizedSceneData);

      // Refresh universe scenes if scene has a universe_id
      if (normalizedSceneData.universe_id) {
        console.log(`THUNK updateScene: Refreshing scenes for universe ${normalizedSceneData.universe_id}`);
        dispatch(fetchScenes(normalizedSceneData.universe_id));
      }

      // Return serializable data
      const serializedResponse = {
        message: response.data?.message || "Scene updated successfully",
        scene: normalizedSceneData,
        status: response.status || 200
      };

      return serializedResponse;
    } catch (error) {
      console.error("THUNK updateScene: Error updating scene:", error);
      return rejectWithValue(handleError(error));
    }
  }
);

/**
 * Delete a scene (soft delete)
 */
export const deleteScene = createAsyncThunk(
  "scenes/delete",
  async (sceneId, { rejectWithValue, dispatch, _getState }) => {
    try {
      console.log("THUNK deleteScene: Called with ID:", sceneId);

      // Input validation
      if (!sceneId) {
        throw new Error("Scene ID is required for deletion");
      }

      // Get scene data before deletion to know which universe to refresh
      let universeId = null;
      // Skip this part since _getState is not used
      // Previously we were trying to look up the universe from state
      
      // Call API to delete scene
      const response = await apiClient.deleteScene(sceneId);
      console.log("THUNK deleteScene: Received API response:", response);

      // Get the scene ID from the response if available, or use the input ID
      const deletedSceneId = response.data?.id || sceneId;
      
      // Get the universe ID from the response if available
      if (response.data?.universe_id) {
        universeId = response.data.universe_id;
        console.log(`THUNK deleteScene: Got universe_id ${universeId} from response`);
      }

      // If we have a universe ID, refresh the scenes for that universe
      if (universeId) {
        console.log(`THUNK deleteScene: Refreshing scenes for universe ${universeId}`);
        dispatch(fetchScenes(universeId));
      }

      // Return serializable data
      const serializedResponse = {
        message: response.data?.message || "Scene deleted successfully",
        id: deletedSceneId,
        universe_id: universeId,
        status: response.status || 200
      };

      return serializedResponse;
    } catch (error) {
      console.error("THUNK deleteScene: Error deleting scene:", error);
      return rejectWithValue(handleError(error));
    }
  }
);

/**
 * Reorder scenes
 */
export const reorderScenes = createAsyncThunk(
  "scenes/reorderScenes",
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
      console.log("Got updated scenes after reordering:", response);

      // Extract and normalize the data
      let scenes = [];

      if (response && response.data && Array.isArray(response.data.scenes)) {
        scenes = normalizeScenes(response.data.scenes);
      } else if (response && Array.isArray(response.scenes)) {
        scenes = normalizeScenes(response.scenes);
      } else if (
        response &&
        typeof response === "object" &&
        response.status === "success"
      ) {
        scenes = normalizeScenes(response.data?.scenes || []);
      } else if (Array.isArray(response)) {
        scenes = normalizeScenes(response);
      } else {
        console.error(
          "Unexpected scenes response format after reordering:",
          response
        );
        scenes = [];
      }

      return { ...response, scenes };
    } catch (error) {
      console.error(
        `Error reordering scenes for universe ${universeId}:`,
        error
      );
      return rejectWithValue(handleError(error));
    }
  }
);

// Fix unused dispatch parameter
export const fetchLocalScenes = () => async (_dispatch, getState) => {
  try {
    // Get scenes from local storage
    const scenes = JSON.parse(localStorage.getItem("scenes") || "[]");
    return scenes;
  } catch (error) {
    console.error("Error fetching scenes from local storage:", error);
    return [];
  }
};

// Fix unused getState parameter
export const deleteSceneLocally = (sceneId) => async (dispatch, _getState) => {
  try {
    console.log("deleteSceneLocally thunk - Deleting scene with ID:", sceneId);
    
    // Get scenes from local storage
    const scenes = JSON.parse(localStorage.getItem("scenes") || "[]");
    
    // Filter out the scene to delete
    const updatedScenes = scenes.filter(scene => scene.id !== sceneId);
    
    // Save the updated scenes back to localStorage
    localStorage.setItem("scenes", JSON.stringify(updatedScenes));
    
    // Dispatch the action to update Redux state
    dispatch({
      type: "scenes/deleteScene/fulfilled",
      payload: { id: sceneId }
    });
    
    console.log("deleteSceneLocally thunk - Scene deleted successfully");
    return { success: true, id: sceneId };
  } catch (error) {
    console.error("Error deleting scene locally:", error);
    return { success: false, error };
  }
}; 