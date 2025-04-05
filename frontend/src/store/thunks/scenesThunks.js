import { createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../services/api.js";
import {
  setCurrentScene,
  addScene,
  setError
} from "../slices/scenesSlice";

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
      console.log(`Fetching scenes for universe ${universeId}`);
      const response = await apiClient.get(`/api/scenes/universe/${universeId}`);

      // Normalize scenes for consistent data format
      const normalizedScenes = normalizeScenes(response.data.scenes || []);

      // We don't need to dispatch an action here since the fetchScenes is handled in the scenesSlice extraReducers

      return {
        scenes: normalizedScenes,
        universeId
      };
    } catch (error) {
      console.error(`Error fetching scenes for universe ${universeId}:`, error);
      dispatch(setError(error.response?.data?.message || error.message));

      // Return a valid response with empty scenes array to prevent UI errors
      return {
        scenes: [],
        universeId,
        error: handleError(error)
      };
    }
  }
);

// Alias for compatibility with existing code
export const fetchScenesForUniverse = fetchScenes;

/**
 * Fetch a single scene by ID
 */
export const fetchSceneById = createAsyncThunk(
  "scenes/fetchSceneById",
  async (sceneId, { dispatch, rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/api/scenes/${sceneId}`);
      const sceneData = normalizeSceneData(response.data.scene || response.data);

      // Update Redux store directly
      dispatch(setCurrentScene(sceneData));

      return {
        scene: sceneData,
        message: response.data?.message
      };
    } catch (error) {
      dispatch(setError(error.response?.data?.message || error.message));
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
      const response = await apiClient.post('/api/scenes', sceneData);
      console.log("Created scene response:", response);

      const newScene = normalizeSceneData(response.data.scene || response.data);

      // Update Redux store directly
      dispatch(addScene(newScene));

      return {
        scene: newScene,
        message: response.data?.message
      };
    } catch (error) {
      console.error("Error creating scene:", error);
      dispatch(setError(error.response?.data?.message || error.message));
      return rejectWithValue(handleError(error));
    }
  }
);

/**
 * Update an existing scene
 */
export const updateScene = createAsyncThunk(
  "scenes/updateScene",
  async ({ id, ...updateData }, { dispatch, rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/api/scenes/${id}`, updateData);
      const updatedScene = normalizeSceneData(response.data.scene || response.data);

      // Instead of using the action creator, dispatch directly to the reducer
      // dispatch(updateSceneAction(updatedScene));
      // Note: The updateScene thunk is handled in the extraReducers of scenesSlice.js
      // so we don't need to dispatch an action here

      return {
        scene: updatedScene,
        message: response.data?.message
      };
    } catch (error) {
      console.error(`Error updating scene ${id}:`, error);
      dispatch(setError(error.response?.data?.message || error.message));
      return rejectWithValue(handleError(error));
    }
  }
);

/**
 * Delete a scene
 */
export const deleteScene = createAsyncThunk(
  "scenes/deleteScene",
  async (sceneId, { dispatch, rejectWithValue }) => {
    try {
      await apiClient.delete(`/api/scenes/${sceneId}`);

      // Don't need to dispatch an action as deleteScene is handled in extraReducers
      // dispatch(deleteSceneAction(sceneId));

      return {
        id: sceneId,
        message: "Scene deleted successfully"
      };
    } catch (error) {
      console.error(`Error deleting scene ${sceneId}:`, error);
      dispatch(setError(error.response?.data?.message || error.message));
      return rejectWithValue(handleError(error));
    }
  }
);

/**
 * Reorder scenes within a universe
 */
export const reorderScenes = createAsyncThunk(
  "scenes/reorderScenes",
  async ({ universeId, sceneOrders }, { dispatch, rejectWithValue }) => {
    try {
      console.log(`Reordering scenes for universe ${universeId}:`, sceneOrders);

      // For simple backend, we can update each scene individually
      const updatePromises = sceneOrders.map(({ id, order }) =>
        apiClient.put(`/api/scenes/${id}`, { display_order: order })
      );

      await Promise.all(updatePromises);

      // After reordering, refresh the scenes list
      dispatch(fetchScenes(universeId));

      return {
        universeId,
        message: "Scenes reordered successfully"
      };
    } catch (error) {
      console.error(`Error reordering scenes for universe ${universeId}:`, error);
      dispatch(setError(error.response?.data?.message || error.message));
      return rejectWithValue(handleError(error));
    }
  }
);

/**
 * Update physics parameters for a scene
 */
export const updateScenePhysicsParams = createAsyncThunk(
  "scenes/updatePhysicsParams",
  async ({ sceneId, physicsParams }, { rejectWithValue }) => {
    try {
      const response = await apiClient.updateScenePhysicsParams(
        sceneId,
        physicsParams
      );

      // Normalize the scene data if present
      if (response && response.data && response.data.scene) {
        response.data.scene = normalizeSceneData(response.data.scene);
      } else if (response && response.scene) {
        response.scene = normalizeSceneData(response.scene);
      } else if (response && response.id) {
        return normalizeSceneData(response);
      }

      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Update harmony parameters for a scene
 */
export const updateSceneHarmonyParams = createAsyncThunk(
  "scenes/updateHarmonyParams",
  async ({ sceneId, harmonyParams }, { rejectWithValue }) => {
    try {
      const response = await apiClient.updateSceneHarmonyParams(
        sceneId,
        harmonyParams
      );

      // Normalize the scene data if present
      if (response && response.data && response.data.scene) {
        response.data.scene = normalizeSceneData(response.data.scene);
      } else if (response && response.scene) {
        response.scene = normalizeSceneData(response.scene);
      } else if (response && response.id) {
        return normalizeSceneData(response);
      }

      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);
