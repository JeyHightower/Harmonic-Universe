import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "../../services/api.js";

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
      const response = await apiClient.getPhysicsObjectsForScene(sceneId);
      console.debug("Physics objects fetched:", response);
      return response.data || [];
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
      const response = await apiClient.createPhysicsObject(physicsObjectData);
      console.debug("Physics object created:", response);
      return response.data;
    } catch (error) {
      console.error("Failed to create physics object:", error);
      return rejectWithValue(handleError(error));
    }
  }
);

// Update a physics object
export const updatePhysicsObject = createAsyncThunk(
  "physicsObjects/updatePhysicsObject",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      console.debug(`Updating physics object ${id}:`, data);
      const response = await apiClient.updatePhysicsObject(id, data);
      console.debug("Physics object updated:", response);
      return response.data;
    } catch (error) {
      console.error("Failed to update physics object:", error);
      return rejectWithValue(handleError(error));
    }
  }
);

// Delete a physics object
export const deletePhysicsObject = createAsyncThunk(
  "physicsObjects/deletePhysicsObject",
  async (id, { rejectWithValue }) => {
    try {
      console.debug(`Deleting physics object ${id}`);
      await apiClient.deletePhysicsObject(id);
      return id; // Return the ID for state updates
    } catch (error) {
      console.error("Failed to delete physics object:", error);
      return rejectWithValue(handleError(error));
    }
  }
);
