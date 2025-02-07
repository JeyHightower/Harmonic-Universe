import api from '@/services/api';
import { Visualization } from '@/types/visualization';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

interface VisualizationState {
  visualizations: Visualization[];
  currentVisualization: Visualization | null;
  loading: boolean;
  error: string | null;
  isRealTime: boolean;
  updateInterval: number;
}

const initialState: VisualizationState = {
  visualizations: [],
  currentVisualization: null,
  loading: false,
  error: null,
  isRealTime: false,
  updateInterval: 1000,
};

export const fetchVisualizations = createAsyncThunk(
  'visualization/fetchVisualizations',
  async (projectId: number) => {
    const response = await api.get(`/api/projects/${projectId}/visualizations`);
    return response.data;
  }
);

export const fetchVisualization = createAsyncThunk(
  'visualization/fetchVisualization',
  async ({ projectId, visualizationId }: { projectId: number; visualizationId: number }) => {
    const response = await api.get(`/api/projects/${projectId}/visualizations/${visualizationId}`);
    return response.data;
  }
);

export const createVisualization = createAsyncThunk(
  'visualization/createVisualization',
  async ({ projectId, data }: { projectId: number; data: Partial<Visualization> }) => {
    const response = await api.post(`/api/projects/${projectId}/visualizations`, data);
    return response.data;
  }
);

export const updateVisualization = createAsyncThunk(
  'visualization/updateVisualization',
  async ({
    projectId,
    visualizationId,
    data,
  }: {
    projectId: number;
    visualizationId: number;
    data: Partial<Visualization>;
  }) => {
    const response = await api.put(
      `/api/projects/${projectId}/visualizations/${visualizationId}`,
      data
    );
    return response.data;
  }
);

export const deleteVisualization = createAsyncThunk(
  'visualization/deleteVisualization',
  async ({ projectId, visualizationId }: { projectId: number; visualizationId: number }) => {
    await api.delete(`/api/projects/${projectId}/visualizations/${visualizationId}`);
    return visualizationId;
  }
);

const visualizationSlice = createSlice({
  name: 'visualization',
  initialState,
  reducers: {
    setUpdateInterval: (state, action) => {
      state.updateInterval = action.payload;
    },
    startRealTime: state => {
      state.isRealTime = true;
    },
    stopRealTime: state => {
      state.isRealTime = false;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch Visualizations
      .addCase(fetchVisualizations.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVisualizations.fulfilled, (state, action) => {
        state.loading = false;
        state.visualizations = action.payload;
      })
      .addCase(fetchVisualizations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch visualizations';
      })
      // Fetch Visualization
      .addCase(fetchVisualization.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVisualization.fulfilled, (state, action) => {
        state.loading = false;
        state.currentVisualization = action.payload;
      })
      .addCase(fetchVisualization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch visualization';
      })
      // Create Visualization
      .addCase(createVisualization.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createVisualization.fulfilled, (state, action) => {
        state.loading = false;
        state.visualizations.push(action.payload);
      })
      .addCase(createVisualization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create visualization';
      })
      // Update Visualization
      .addCase(updateVisualization.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateVisualization.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.visualizations.findIndex(v => v.id === action.payload.id);
        if (index !== -1) {
          state.visualizations[index] = action.payload;
        }
        if (state.currentVisualization?.id === action.payload.id) {
          state.currentVisualization = action.payload;
        }
      })
      .addCase(updateVisualization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update visualization';
      })
      // Delete Visualization
      .addCase(deleteVisualization.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteVisualization.fulfilled, (state, action) => {
        state.loading = false;
        state.visualizations = state.visualizations.filter(v => v.id !== action.payload);
        if (state.currentVisualization?.id === action.payload) {
          state.currentVisualization = null;
        }
      })
      .addCase(deleteVisualization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete visualization';
      });
  },
});

export const { setUpdateInterval, startRealTime, stopRealTime } = visualizationSlice.actions;

export const selectVisualizations = (state: { visualization: VisualizationState }) =>
  state.visualization.visualizations;
export const selectCurrentVisualization = (state: { visualization: VisualizationState }) =>
  state.visualization.currentVisualization;
export const selectVisualizationLoading = (state: { visualization: VisualizationState }) =>
  state.visualization.loading;
export const selectVisualizationError = (state: { visualization: VisualizationState }) =>
  state.visualization.error;
export const selectIsRealTime = (state: { visualization: VisualizationState }) =>
  state.visualization.isRealTime;
export const selectUpdateInterval = (state: { visualization: VisualizationState }) =>
  state.visualization.updateInterval;

export default visualizationSlice.reducer;
