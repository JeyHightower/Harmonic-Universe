import { createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../../services/api";
import { setScenes, setCurrentScene, addScene, updateScene as updateSceneInStore, deleteScene as deleteSceneFromStore, setError } from "../../slices/sceneSlice";

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
      const response = await apiClient.getScenes(universeId);
      console.log("Got scenes response:", response);

      // Update direct store if needed
      if (dispatch) {
        dispatch(setScenes(response.data?.scenes || []));
      }

      // Return serializable data
      return {
        message: response.data?.message,
        scenes: response.data?.scenes || [],
        status: response.status
      };
    } catch (error) {
      if (dispatch) {
        dispatch(setError(error.response?.data?.message || error.message));
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
        dispatch(setCurrentScene(response.data?.scene || response.data));
      }

      // Return serializable data
      return {
        scene: response.data?.scene || response.data,
        message: response.data?.message
      };
    } catch (error) {
      if (dispatch) {
        dispatch(setError(error.response?.data?.message || error.message));
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
  async (sceneData, { dispatch, rejectWithValue }) => {
    try {
      console.log("Creating scene with data:", sceneData);
      const response = await apiClient.createScene(sceneData);
      console.log("Created scene response:", response);

      // Update direct store if needed
      if (dispatch) {
        dispatch(addScene(response.data?.scene));
      }

      // Return serializable data
      const serializedResponse = {
        message: response.data?.message,
        scene: response.data?.scene,
        status: response.status
      };

      // Normalize the scene data if present
      if (serializedResponse.scene) {
        serializedResponse.scene = normalizeSceneData(serializedResponse.scene);
      }

      return serializedResponse;
    } catch (error) {
      if (dispatch) {
        dispatch(setError(error.response?.data?.message || error.message));
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
        dispatch(updateSceneInStore(response.data?.scene || response.data));
      }

      // Return serializable data
      return {
        scene: response.data?.scene || response.data,
        message: response.data?.message
      };
    } catch (error) {
      if (dispatch) {
        dispatch(setError(error.response?.data?.message || error.message));
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
      const response = await apiClient.deleteScene(sceneId);

      // Update direct store if needed
      if (dispatch) {
        dispatch(deleteSceneFromStore(sceneId));
      }

      // Return serializable data with the ID for the reducer
      return {
        id: sceneId,
        message: response.data?.message
      };
    } catch (error) {
      if (dispatch) {
        dispatch(setError(error.response?.data?.message || error.message));
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