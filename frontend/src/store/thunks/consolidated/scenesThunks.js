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
  "scenes/fetchSceneById",
  async (sceneId, { dispatch, rejectWithValue }) => {
    try {
      const response = await apiClient.getScene(sceneId);

      // Update direct store if needed
      if (dispatch) {
        dispatch({ type: 'scenes/setCurrentScene', payload: response.data?.scene || response.data });
      }

      // Return serializable data
      return {
        scene: response.data?.scene || response.data,
        message: response.data?.message
      };
    } catch (error) {
      if (dispatch) {
        dispatch({ type: 'scenes/setError', payload: error.response?.data?.message || error.message });
      }
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
      console.log("Creating scene with data:", sceneData);
      const response = await apiClient.createScene(sceneData);
      console.log("Created scene response:", response);

      // More detailed logging of response format
      console.log("Create scene response format analysis:", {
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        sceneInResponse: !!response.data?.scene,
        responseStatus: response.status
      });

      // Create a default scene object with the input data as fallback
      // This ensures we have valid data even if the API returns incomplete data
      const defaultSceneData = {
        id: Date.now().toString(), // Generate a temporary ID if needed
        name: sceneData.name || sceneData.title || "New Scene",
        description: sceneData.description || "",
        universe_id: sceneData.universe_id,
        scene_type: sceneData.scene_type || "standard",
        is_active: sceneData.is_active !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Add any other fields your UI expects
      };

      // Get scene data from response or use default if missing/incomplete
      let sceneResponseData = response.data?.scene;

      // If scene data is missing or empty, use our default
      if (!sceneResponseData || Object.keys(sceneResponseData).length === 0) {
        console.warn("Scene data missing in API response, using default scene data");
        sceneResponseData = defaultSceneData;
      } else {
        // Ensure all required properties are present, use defaults for missing ones
        sceneResponseData = {
          ...defaultSceneData,
          ...sceneResponseData
        };
      }

      console.log("Using scene data:", sceneResponseData);

      // Normalize the scene data
      const normalizedSceneData = normalizeSceneData(sceneResponseData);

      // Update direct store if needed
      if (dispatch) {
        console.log("Adding scene to store and locally created scenes:", normalizedSceneData.id);

        // Add to regular scenes array
        dispatch({ type: 'scenes/addScene', payload: normalizedSceneData });

        // Also add to locally created scenes for persistence
        dispatch(addLocallyCreatedScene(normalizedSceneData));
      }

      // Return serializable data
      const serializedResponse = {
        message: response.data?.message || "Scene created successfully",
        scene: normalizedSceneData,
        status: response.status || 200
      };

      return serializedResponse;
    } catch (error) {
      if (dispatch) {
        dispatch({ type: 'scenes/setError', payload: error.response?.data?.message || error.message });
      }
      console.error("Error creating scene:", error);
      return rejectWithValue(handleError(error));
    }
  }
);

/**
 * Update an existing scene
 */
export const updateScene = createAsyncThunk(
  "scenes/updateScene",
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      const response = await apiClient.updateScene(id, data);

      // Update direct store if needed
      if (dispatch) {
        dispatch({ type: 'scenes/updateScene', payload: response.data?.scene || response.data });
      }

      // Return serializable data
      return {
        scene: response.data?.scene || response.data,
        message: response.data?.message
      };
    } catch (error) {
      if (dispatch) {
        dispatch({ type: 'scenes/setError', payload: error.response?.data?.message || error.message });
      }
      console.error(`Error updating scene ${id}:`, error);
      return rejectWithValue(handleError(error));
    }
  }
);

// Alias for updateScene to maintain backward compatibility
export const updateSceneById = updateScene;

/**
 * Delete a scene
 */
export const deleteScene = createAsyncThunk(
  "scenes/deleteScene",
  async (sceneId, { dispatch, rejectWithValue }) => {
    try {
      console.log("Deleting scene:", sceneId);
      const response = await apiClient.deleteScene(sceneId);

      // Validate response
      if (response.status === 200 || response.status === 204) {
        console.log(`Successfully deleted scene ${sceneId}:`, response);

        // Update direct store if needed
        if (dispatch) {
          dispatch({ type: 'scenes/deleteScene', payload: { id: sceneId } });
        }

        // Return the ID for easy access in the reducer
        return { id: sceneId, status: response.status };
      } else {
        console.error(`Error deleting scene ${sceneId}:`, response);
        return rejectWithValue({ message: "Failed to delete scene", status: response.status });
      }
    } catch (error) {
      if (dispatch) {
        dispatch({ type: 'scenes/setError', payload: error.response?.data?.message || error.message });
      }
      console.error(`Error deleting scene ${sceneId}:`, error);
      return rejectWithValue(handleError(error));
    }
  }
);

// Alias for deleteScene to maintain backward compatibility
export const deleteSceneById = deleteScene;

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