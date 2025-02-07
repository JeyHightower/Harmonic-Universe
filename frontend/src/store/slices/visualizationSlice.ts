import axiosInstance from '@/services/api';
import { Visualization } from '@/types';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export interface DataMapping {
  id: number;
  data_field: string;
  visual_property: string;
  mapping_type: string;
  range_min?: number;
  range_max?: number;
  scale_factor?: number;
  enabled: boolean;
}

export interface StreamConfig {
  stream_type: string;
  buffer_size: number;
  sample_rate: number;
  connection_settings: {
    [key: string]: any;
  };
  processing_pipeline: Array<{
    type: string;
    params: {
      [key: string]: any;
    };
  }>;
}

export interface Visualization {
  id: number;
  name: string;
  description: string;
  visualization_type: string;
  data_source: string;
  settings: {
    [key: string]: any;
  };
  layout: {
    position: string;
    size: string;
  };
  style: {
    backgroundColor: string;
    [key: string]: any;
  };
  is_real_time: boolean;
  update_interval: number;
  data_mappings?: DataMapping[];
  stream_config?: StreamConfig;
  metrics?: {
    fps: number;
    dataPoints: number;
    peakAmplitude: number;
    [key: string]: any;
  };
}

interface VisualizationState {
  visualizations: Visualization[];
  selectedVisualizationId: number | null;
  loading: boolean;
  error: string | null;
}

const initialState: VisualizationState = {
  visualizations: [],
  selectedVisualizationId: null,
  loading: false,
  error: null,
};

export const fetchVisualizations = createAsyncThunk(
  'visualization/fetchVisualizations',
  async () => {
    const response = await axiosInstance.get('/visualization/visualizations');
    return response.data;
  }
);

export const createVisualization = createAsyncThunk(
  'visualization/createVisualization',
  async (visualization: Omit<Visualization, 'id'>) => {
    const response = await axiosInstance.post('/visualization/visualizations', visualization);
    return response.data;
  }
);

export const updateVisualization = createAsyncThunk(
  'visualization/updateVisualization',
  async ({ id, ...updates }: Partial<Visualization> & { id: number }) => {
    const response = await axiosInstance.patch(`/visualization/visualizations/${id}`, updates);
    return response.data;
  }
);

export const deleteVisualization = createAsyncThunk(
  'visualization/deleteVisualization',
  async (id: number) => {
    await axiosInstance.delete(`/visualization/visualizations/${id}`);
    return id;
  }
);

const visualizationSlice = createSlice({
  name: 'visualization',
  initialState,
  reducers: {
    setSelectedVisualization: (state, action) => {
      state.selectedVisualizationId = action.payload;
    },
    clearError: state => {
      state.error = null;
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
        const index = state.visualizations.findIndex(vis => vis.id === action.payload.id);
        if (index !== -1) {
          state.visualizations[index] = action.payload;
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
        state.visualizations = state.visualizations.filter(vis => vis.id !== action.payload);
        if (state.selectedVisualizationId === action.payload) {
          state.selectedVisualizationId = null;
        }
      })
      .addCase(deleteVisualization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete visualization';
      });
  },
});

export const { setSelectedVisualization, clearError } = visualizationSlice.actions;
export default visualizationSlice.reducer;
