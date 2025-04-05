import { createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/api';
import { setScenes, setCurrentScene, addScene, updateScene, deleteScene, setError } from '../slices/sceneSlice';

// Helper function for error handling
const handleError = (error) => {
  console.error("API Error:", error);
  return {
    message:
      error.response?.data?.message || error.message || "An error occurred",
    status: error.response?.status,
    data: error.response?.data,
  };
};

// Fetch all scenes for a universe
export const fetchScenes = createAsyncThunk(
  'scene/fetchScenes',
  async (universeId, { dispatch, rejectWithValue }) => {
    try {
      const response = await apiClient.getScenesByUniverse(universeId);
      dispatch(setScenes(response.data.scenes));
      return response.data.scenes;
    } catch (error) {
      dispatch(setError(error.response?.data?.message || error.message));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch a specific scene
export const fetchSceneById = createAsyncThunk(
  'scene/fetchSceneById',
  async (sceneId, { dispatch, rejectWithValue }) => {
    try {
      const response = await apiClient.getScene(sceneId);
      dispatch(setCurrentScene(response.data.scene));
      return response.data.scene;
    } catch (error) {
      dispatch(setError(error.response?.data?.message || error.message));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create a new scene
export const createScene = createAsyncThunk(
  'scene/createScene',
  async (sceneData, { dispatch, rejectWithValue }) => {
    try {
      const response = await apiClient.createScene(sceneData);
      dispatch(addScene(response.data.scene));
      return response.data.scene;
    } catch (error) {
      dispatch(setError(error.response?.data?.message || error.message));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update an existing scene
export const updateScene = createAsyncThunk(
  "scenes/updateScene",
  async ({ sceneId, sceneData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.updateScene(sceneId, sceneData);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// Delete a scene
export const deleteScene = createAsyncThunk(
  "scenes/deleteScene",
  async (sceneId, { rejectWithValue }) => {
    try {
      await apiClient.deleteScene(sceneId);
      return sceneId;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
); 