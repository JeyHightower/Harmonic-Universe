import api from '@/services/api';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

/**
 * @typedef {Object} Project
 * @property {number} id
 * @property {string} name
 * @property {string} description
 * @property {string} status
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {number} userId
 */

/**
 * @typedef {Object} ProjectState
 * @property {Project|null} currentProject
 * @property {boolean} loading
 * @property {string|null} error
 */

const initialState = {
  currentProject: null,
  loading: false,
  error: null,
};

export const fetchProject = createAsyncThunk(
  'project/fetchProject',
  async (projectId) => {
    const response = await api.get(`/api/projects/${projectId}`);
    return response.data;
  }
);

export const updateProject = createAsyncThunk(
  'project/updateProject',
  async ({ projectId, updates }) => {
    const response = await api.put(`/api/projects/${projectId}`, updates);
    return response.data;
  }
);

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProject = action.payload;
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch project';
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.currentProject = action.payload;
      });
  },
});

export const selectCurrentProject = (state) => state.projects.currentProject;
export const selectProjectLoading = (state) => state.projects.loading;
export const selectProjectError = (state) => state.projects.error;

export default projectSlice.reducer;
