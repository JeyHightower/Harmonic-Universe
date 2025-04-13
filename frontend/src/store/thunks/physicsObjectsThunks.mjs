import { createAsyncThunk } from "@reduxjs/toolkit";
import api from '../../services/api.adapter';

const handleError = (error) => {
  console.error("API Error:", error);
  return {
    message:
      error.response?.data?.message || error.message || "An error occurred",
    status: error.response?.status,
    data: error.response?.data,
  };
};

// Fetch physics objects for a scene
export const fetchPhysicsObjects = createAsyncThunk(
  "physicsObjects/fetchPhysicsObjects",
  async (sceneId, { rejectWithValue }) => {
    try {
      console.debug(`Fetching physics objects for scene ${sceneId}`);
      const response = await api.scenes.getSceneSettings(sceneId);
      console.debug("Physics objects fetched:", response);
      return response.data?.physicsObjects || [];
    } catch (error) {
      console.error("Failed to fetch physics objects:", error);
      return rejectWithValue(handleError(error));
    }
  }
);

// Create a new physics object
export const createPhysicsObject = createAsyncThunk(
  "physicsObjects/createPhysicsObject",
  async (physicsObjectData, { rejectWithValue }) => {
    try {
      console.debug("Creating physics object:", physicsObjectData);
      const { sceneId, ...objectData } = physicsObjectData;
      
      // First get current scene settings
      const sceneResponse = await api.scenes.getSceneSettings(sceneId);
      const currentSettings = sceneResponse.data || {};
      
      // Add new physics object to the list
      const physicsObjects = [...(currentSettings.physicsObjects || []), objectData];
      
      // Update scene settings with new physics objects
      const response = await api.scenes.updateSceneSettings(sceneId, {
        ...currentSettings,
        physicsObjects
      });
      
      console.debug("Physics object created:", response);
      return objectData;
    } catch (error) {
      console.error("Failed to create physics object:", error);
      return rejectWithValue(handleError(error));
    }
  }
);

// Update a physics object
export const updatePhysicsObject = createAsyncThunk(
  "physicsObjects/updatePhysicsObject",
  async ({ id, sceneId, data }, { rejectWithValue }) => {
    try {
      console.debug(`Updating physics object ${id}:`, data);
      
      // First get current scene settings
      const sceneResponse = await api.scenes.getSceneSettings(sceneId);
      const currentSettings = sceneResponse.data || {};
      
      // Update the specific physics object
      const physicsObjects = (currentSettings.physicsObjects || []).map(obj => 
        obj.id === id ? { ...obj, ...data } : obj
      );
      
      // Update scene settings with modified physics objects
      const response = await api.scenes.updateSceneSettings(sceneId, {
        ...currentSettings,
        physicsObjects
      });
      
      console.debug("Physics object updated:", response);
      return { id, ...data };
    } catch (error) {
      console.error("Failed to update physics object:", error);
      return rejectWithValue(handleError(error));
    }
  }
);

// Delete a physics object
export const deletePhysicsObject = createAsyncThunk(
  "physicsObjects/deletePhysicsObject",
  async ({ id, sceneId }, { rejectWithValue }) => {
    try {
      console.debug(`Deleting physics object ${id}`);
      
      // First get current scene settings
      const sceneResponse = await api.scenes.getSceneSettings(sceneId);
      const currentSettings = sceneResponse.data || {};
      
      // Filter out the deleted physics object
      const physicsObjects = (currentSettings.physicsObjects || []).filter(obj => obj.id !== id);
      
      // Update scene settings without the deleted physics object
      await api.scenes.updateSceneSettings(sceneId, {
        ...currentSettings,
        physicsObjects
      });
      
      return id; // Return the ID for state updates
    } catch (error) {
      console.error("Failed to delete physics object:", error);
      return rejectWithValue(handleError(error));
    }
  }
);
