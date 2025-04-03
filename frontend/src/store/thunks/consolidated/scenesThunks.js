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
  async (universeId, { dispatch, rejectWithValue }) => {
    try {
      console.log("Fetching scenes for universe", universeId);

      // Try using getScenes first
      let response;
      try {
        console.log("Attempting to fetch scenes using getScenes");
        response = await apiClient.getScenes(universeId);
        console.log("Got scenes response from getScenes:", response);
      } catch (initialError) {
        console.error("Initial getScenes request failed, trying getUniverseScenes as fallback:", initialError);
        // If getScenes fails, try getUniverseScenes as fallback
        response = await apiClient.getUniverseScenes(universeId);
        console.log("Got scenes response from fallback getUniverseScenes:", response);
      }

      // Check for error status and data structure
      if (response.status >= 400 || !response.data) {
        console.error("Error in scenes response:", response);
        if (dispatch) {
          const errorMessage = response.data?.message || `Error fetching scenes for universe ${universeId}`;
          dispatch({ type: 'scenes/setError', payload: errorMessage });
        }
        return rejectWithValue({
          message: response.data?.message || `Error fetching scenes for universe ${universeId}`,
          status: response.status,
          data: response.data || {},
        });
      }

      // Debug log the actual response structure to diagnose issues
      console.log("DEBUG - Full response structure:", JSON.stringify(response.data));

      // Handle different response formats - we need to be flexible about where the scenes are in the response
      let scenes = [];

      console.log("DEBUG SCENES: Beginning to extract scenes from response format");
      // Log the entire response structure for debugging
      console.log("DEBUG SCENES: Response structure keys:", Object.keys(response.data));

      // Try different possible locations where scenes might be in the API response
      if (Array.isArray(response.data.scenes)) {
        // Format: { scenes: [...] }
        console.log("DEBUG SCENES: Found scenes in response.data.scenes (array)");
        scenes = response.data.scenes;
      } else if (Array.isArray(response.data)) {
        // Format: [scene1, scene2, ...]
        console.log("DEBUG SCENES: Found scenes directly in response.data (array)");
        scenes = response.data;
      } else if (response.data && typeof response.data === 'object' && response.data.data && Array.isArray(response.data.data.scenes)) {
        // Format: { data: { scenes: [...] } }
        console.log("DEBUG SCENES: Found scenes in response.data.data.scenes (array)");
        scenes = response.data.data.scenes;
      } else if (response.data && typeof response.data === 'object' && response.data.data && Array.isArray(response.data.data)) {
        // Format: { data: [...] }
        console.log("DEBUG SCENES: Found scenes in response.data.data (array)");
        scenes = response.data.data;
      } else {
        // Try to handle other potential formats
        console.warn("DEBUG SCENES: Could not identify scenes array in response, searching for any array properties");
        console.log("DEBUG SCENES: Response data type:", typeof response.data);

        if (response.data && typeof response.data === 'object') {
          console.log("DEBUG SCENES: Response data keys:", Object.keys(response.data));

          // Look for scenes property with any type
          if (response.data.scenes) {
            console.log("DEBUG SCENES: Found 'scenes' property but not an array:", typeof response.data.scenes);

            // Try to convert to array if it's something else
            if (typeof response.data.scenes === 'object' && !Array.isArray(response.data.scenes)) {
              console.log("DEBUG SCENES: Attempting to convert scenes object to array");
              try {
                scenes = Object.values(response.data.scenes);
                console.log("DEBUG SCENES: Converted to array with length:", scenes.length);
              } catch (err) {
                console.error("DEBUG SCENES: Error converting scenes to array:", err);
              }
            }
          }

          // Look for any array property that might contain scenes
          const arrayProps = Object.entries(response.data)
            .filter(([key, value]) => Array.isArray(value))
            .map(([key, value]) => ({ key, length: value.length }));

          if (arrayProps.length > 0) {
            // Use the largest array, which is likely to be the scenes
            const largestArrayProp = arrayProps.sort((a, b) => b.length - a.length)[0];
            console.log(`DEBUG SCENES: Using ${largestArrayProp.key} as scenes array with ${largestArrayProp.length} items`);
            scenes = response.data[largestArrayProp.key];
          } else {
            console.error("DEBUG SCENES: No arrays found in response data, using empty array for scenes");
          }
        } else {
          console.error("DEBUG SCENES: Response data is not an object:", typeof response.data);
        }
      }

      // Check if we have any scenes at this point
      console.log("DEBUG SCENES: Extracted scenes count:", scenes ? scenes.length : 0);

      // Normalize the scenes array
      const normalizedScenes = normalizeScenes(scenes);
      console.log(`DEBUG SCENES: Normalized ${normalizedScenes.length} scenes`);
      if (normalizedScenes.length > 0) {
        console.log("DEBUG SCENES: First normalized scene:", normalizedScenes[0]);
      }

      // Update direct store if needed
      if (dispatch) {
        console.log("Dispatching setScenes with:", normalizedScenes);
        dispatch({ type: 'scenes/fetchScenes/fulfilled', payload: { scenes: normalizedScenes } });
      }

      // Return serializable data
      return {
        message: response.data?.message || "Scenes fetched successfully",
        scenes: normalizedScenes,
        status: response.status
      };
    } catch (error) {
      if (dispatch) {
        dispatch({ type: 'scenes/setError', payload: error.response?.data?.message || error.message });
      }
      console.error(`Error fetching scenes for universe ${universeId}:`, error);
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