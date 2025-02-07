import api from '@/services/api';
import { AppDispatch, RootState } from '@/store/store';

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';


const initialState: ProjectState = {
  currentProject: null,
  loading: false,
  error: null,
};

export const fetchProject = createAsyncThunk('project/fetchProject', async (projectId: number) => {
  const response = await api.get(`/api/projects/${projectId}`);
  return response.data;
});

export const updateProject = createAsyncThunk(
  'project/updateProject',
  async ({ projectId, updates }: { projectId: number; updates: Partial }) => {
    const response = await api.put(`/api/projects/${projectId}`, updates);
    return response.data;
  }
);

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchProject.pending, state => {
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

export const useProject = () => {
  const dispatch = useDispatch();
  const project = useSelector((state: RootState) => state.projects.currentProject);
  const loading = useSelector((state: RootState) => state.projects.loading);
  const error = useSelector((state: RootState) => state.projects.error);

  const handleFetchProject = useCallback(
    async (projectId: number) => {
      await dispatch(fetchProject(projectId));
    },
    [dispatch]
  );

  const handleUpdateProject = useCallback(
    async (projectId: number, updates: Partial) => {
      await dispatch(updateProject({ projectId, updates }));
    },
    [dispatch]
  );

  return {
    project,
    loading,
    error,
    fetchProject: handleFetchProject,
    updateProject: handleUpdateProject,
  };
};

export default projectSlice.reducer;
