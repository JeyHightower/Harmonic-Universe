import { createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../services/api";

const handleError = (error) => {
  console.error("API Error:", error);
  return {
    message:
      error.response?.data?.message || error.message || "An error occurred",
    status: error.response?.status,
    data: error.response?.data,
  };
};

// Fetch all universes
export const fetchUniverses = createAsyncThunk(
  "universe/fetchUniverses",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.getUniverses(params);
      // Return just the data to avoid serialization issues with headers
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch a specific universe by ID
export const fetchUniverseById = createAsyncThunk(
  "universe/fetchUniverseById",
  async ({ id, includeScenes = false }, { rejectWithValue }) => {
    try {
      const response = await apiClient.getUniverse(id, { includeScenes });
      // Return just the data to avoid serialization issues with headers
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create a new universe
export const createUniverse = createAsyncThunk(
  "universe/createUniverse",
  async (universeData, { rejectWithValue }) => {
    try {
      const response = await apiClient.createUniverse(universeData);
      // Return just the data to avoid serialization issues with headers
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update an existing universe
export const updateUniverse = createAsyncThunk(
  "universe/updateUniverse",
  async ({ id, ...updateData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.updateUniverse(id, updateData);
      // Return just the data to avoid serialization issues with headers
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete a universe
export const deleteUniverse = createAsyncThunk(
  "universe/deleteUniverse",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.deleteUniverse(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch scenes for a specific universe
export const fetchScenesForUniverse = createAsyncThunk(
  "universe/fetchScenesForUniverse",
  async (universeId, { rejectWithValue }) => {
    try {
      // Using standard api call since there's no specific method for this in apiClient
      const response = await apiClient.getUniverseScenes(universeId);
      // Return just the data to avoid serialization issues with headers
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update physics parameters
export const updatePhysicsParams = createAsyncThunk(
  "universe/updatePhysicsParams",
  async ({ universeId, physicsParams }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(
        `/api/universes/${universeId}/physics`,
        {
          physics_params: physicsParams,
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update harmony parameters
export const updateHarmonyParams = createAsyncThunk(
  "universe/updateHarmonyParams",
  async ({ universeId, harmonyParams }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(
        `/api/universes/${universeId}/harmony`,
        {
          harmony_params: harmonyParams,
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
