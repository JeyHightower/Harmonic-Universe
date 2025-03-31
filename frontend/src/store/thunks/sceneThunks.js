import { createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/api';
import { setScenes, setCurrentScene, addScene, updateScene, deleteScene, setError } from '../slices/sceneSlice';

// Fetch all scenes for a universe
export const fetchScenes = createAsyncThunk(
  'scene/fetchScenes',
  async (universeId, { dispatch, rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/api/scenes/universe/${universeId}`);
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
      const response = await apiClient.get(`/api/scenes/${sceneId}`);
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
      const response = await apiClient.post('/api/scenes', sceneData);
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
  'scene/updateScene',
  async ({ id, ...updateData }, { dispatch, rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/api/scenes/${id}`, updateData);
      dispatch(updateScene(response.data.scene));
      return response.data.scene;
    } catch (error) {
      dispatch(setError(error.response?.data?.message || error.message));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete a scene
export const deleteScene = createAsyncThunk(
  'scene/deleteScene',
  async (sceneId, { dispatch, rejectWithValue }) => {
    try {
      await apiClient.delete(`/api/scenes/${sceneId}`);
      dispatch(deleteScene(sceneId));
      return sceneId;
    } catch (error) {
      dispatch(setError(error.response?.data?.message || error.message));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
); 