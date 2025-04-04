import { createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../services/api.js";

const handleError = (error) => {
  console.error("API Error:", error);
  return {
    message:
      error.response?.data?.message || error.message || "An error occurred",
    status: error.response?.status,
    data: error.response?.data,
  };
};

// Helper function to normalize scene data (especially date fields)
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

// Helper function to normalize scenes array
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
      console.log("Fetching scenes for universe", universeId);
      const response = await apiClient.getScenes(universeId);
      console.log("Got scenes response:", response);

      // Extra debugging for problematic universe IDs like 6
      if (universeId == 6) {
        console.log("DETAILED DEBUG - Universe 6 response:", JSON.stringify(response));
      }

      // Check if we received an error response that was wrapped in a success response
      if (response.data?.error) {
        console.warn("API returned an error in a success response:", response.data.error);
        // Return a valid response with empty scenes array even on error
        return {
          message: response.data.message || "Error fetching scenes",
          scenes: response.data.scenes || [],
          status: response.status || 200,
          error: response.data.error,
          universeId // Include the universeId for easier debugging
        };
      }

      // Return only serializable data
      const serializedResponse = {
        message: response.data?.message,
        scenes: response.data?.scenes || [],
        status: response.status,
        universeId // Include the universeId for easier debugging
      };

      return serializedResponse;
    } catch (error) {
      console.error(`Error fetching scenes for universe ${universeId}:`, error);

      // Return a valid response with empty scenes array even on error
      // This prevents the UI from breaking on API errors
      return {
        message: error.response?.data?.message || "Error fetching scenes",
        scenes: [],
        status: error.response?.status || 500,
        error: handleError(error),
        universeId // Include the universeId for easier debugging
      };
    }
  }
);

// Fetch scenes for a specific universe
export const fetchScenesForUniverse = createAsyncThunk(
  "scenes/fetchScenesForUniverse",
  async (universeId, { rejectWithValue }) => {
    try {
      console.log(`Thunk - Fetching scenes for universe ${universeId}`);

      // Handle API errors more gracefully
      try {
        const response = await apiClient.getScenes(universeId);
        console.log("Thunk - Got scenes response:", response);

        // Check if response has an error but was wrapped in a success response
        if (response.data?.error) {
          console.warn("API returned an error in success response:", response.data.error);
          return {
            scenes: response.data?.scenes || [],
            error: response.data.error,
            message: response.data.message || "API error occurred"
          };
        }

        // Check if response has valid data
        if (!response.data) {
          console.warn("Thunk - No data in response:", response);
          return { scenes: [], error: "No data returned from API" };
        }

        // Extract scenes array, providing fallbacks
        let scenes = [];
        if (Array.isArray(response.data?.scenes)) {
          scenes = response.data.scenes;
        } else if (Array.isArray(response.data)) {
          scenes = response.data;
        }

        console.log(`Thunk - Successfully retrieved ${scenes.length} scenes`);
        return { scenes, message: response.data?.message || "Scenes retrieved successfully" };
      } catch (apiError) {
        console.error(`Thunk - API error fetching scenes for universe ${universeId}:`, apiError);

        // Always return a valid object with an empty scenes array instead of rejecting
        return {
          scenes: [],
          error: apiError.message || "Error fetching scenes",
          message: "Error occurred, but continuing with empty scenes"
        };
      }
    } catch (error) {
      console.error(`Thunk - Unexpected error in scenes thunk:`, error);
      // Even for unexpected errors, return an object with empty scenes
      return {
        scenes: [],
        error: error.message || "Unexpected error",
        message: "Unexpected error occurred"
      };
    }
  }
);

/**
 * Fetch a single scene by ID
 */
export const fetchSceneById = createAsyncThunk(
  "scenes/fetchSceneById",
  async (sceneId, { rejectWithValue }) => {
    try {
      const response = await apiClient.getScene(sceneId);

      // Return only serializable data
      return {
        scene: response.data?.scene || response.data,
        message: response.data?.message
      };
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

/**
 * Create a new scene
 */
export const createScene = createAsyncThunk(
  "scenes/createScene",
  async (sceneData, { rejectWithValue }) => {
    try {
      console.log("Creating scene with data:", sceneData);
      const response = await apiClient.createScene(sceneData);
      console.log("Created scene response:", response);

      // Return only serializable data
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
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await apiClient.updateScene(id, data);

      // Return only serializable data
      return {
        scene: response.data?.scene || response.data,
        message: response.data?.message
      };
    } catch (error) {
      console.error(`Error updating scene ${id}:`, error);
      return rejectWithValue(handleError(error));
    }
  }
);

/**
 * Delete a scene
 */
export const deleteScene = createAsyncThunk(
  "scenes/deleteScene",
  async (sceneId, { rejectWithValue }) => {
    try {
      const response = await apiClient.deleteScene(sceneId);

      // Return only serializable data with the ID for the reducer
      return {
        id: sceneId,
        message: response.data?.message
      };
    } catch (error) {
      console.error(`Error deleting scene ${sceneId}:`, error);
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
