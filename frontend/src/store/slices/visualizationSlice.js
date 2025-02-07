import visualizationApi from '@/services/visualizationApi';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const initialState = {
  visualizations: [],
  currentVisualization: null,
  isPlaying: false,
  loading: false,
  error: null,
};

export const fetchVisualizations = createAsyncThunk(
  'visualization/fetchAll',
  async (projectId) => {
    return visualizationApi.fetchAll(projectId);
  }
);

export const fetchVisualizationsByAudio = createAsyncThunk(
  'visualization/fetchByAudio',
  async (audioId) => {
    return visualizationApi.fetchByAudio(audioId);
  }
);

export const fetchVisualization = createAsyncThunk(
  'visualization/fetchOne',
  async (id) => {
    return visualizationApi.fetchOne(id);
  }
);

export const createVisualization = createAsyncThunk(
  'visualization/create',
  async ({ projectId, audioId, data }) => {
    return visualizationApi.create(projectId, audioId, data);
  }
);

export const updateVisualization = createAsyncThunk(
  'visualization/update',
  async ({ id, data }) => {
    return visualizationApi.update(id, data);
  }
);

export const deleteVisualization = createAsyncThunk(
  'visualization/delete',
  async (id) => {
    await visualizationApi.delete(id);
    return id;
  }
);

export const updateDataMappings = createAsyncThunk(
  'visualization/updateDataMappings',
  async ({ id, dataMappings }) => {
    return visualizationApi.updateDataMappings(id, dataMappings);
  }
);

export const updateStreamConfig = createAsyncThunk(
  'visualization/updateStreamConfig',
  async ({ id, streamConfig }) => {
    return visualizationApi.updateStreamConfig(id, streamConfig);
  }
);

const visualizationSlice = createSlice({
  name: 'visualization',
  initialState,
  reducers: {
    setCurrentVisualization: (state, action) => {
      state.currentVisualization = action.payload;
    },
    addVisualization: (state, action) => {
      state.visualizations.push(action.payload);
    },
    updateVisualizationState: (state, action) => {
      const index = state.visualizations.findIndex(v => v.id === action.payload.id);
      if (index !== -1) {
        state.visualizations[index] = { ...state.visualizations[index], ...action.payload };
      }
    },
    deleteVisualizationState: (state, action) => {
      state.visualizations = state.visualizations.filter(v => v.id !== action.payload);
      if (state.currentVisualization?.id === action.payload) {
        state.currentVisualization = null;
      }
    },
    setIsPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },
    addObject: (state, action) => {
      const visualization = state.visualizations.find(v => v.id === action.payload.visualizationId);
      if (visualization) {
        visualization.objects.push(action.payload.object);
      }
    },
    updateObject: (state, action) => {
      const visualization = state.visualizations.find(v => v.id === action.payload.visualizationId);
      if (visualization) {
        const objectIndex = visualization.objects.findIndex(o => o.id === action.payload.objectId);
        if (objectIndex !== -1) {
          visualization.objects[objectIndex] = {
            ...visualization.objects[objectIndex],
            ...action.payload.updates,
          };
        }
      }
    },
    deleteObject: (state, action) => {
      const visualization = state.visualizations.find(v => v.id === action.payload.visualizationId);
      if (visualization) {
        visualization.objects = visualization.objects.filter(o => o.id !== action.payload.objectId);
      }
    },
  },
  extraReducers: builder => {
    builder
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
      .addCase(fetchVisualizationsByAudio.fulfilled, (state, action) => {
        state.visualizations = action.payload;
      })
      .addCase(fetchVisualization.fulfilled, (state, action) => {
        const index = state.visualizations.findIndex(v => v.id === action.payload.id);
        if (index !== -1) {
          state.visualizations[index] = action.payload;
        } else {
          state.visualizations.push(action.payload);
        }
        if (state.currentVisualization?.id === action.payload.id) {
          state.currentVisualization = action.payload;
        }
      })
      .addCase(createVisualization.fulfilled, (state, action) => {
        state.visualizations.push(action.payload);
      })
      .addCase(updateVisualization.fulfilled, (state, action) => {
        const index = state.visualizations.findIndex(v => v.id === action.payload.id);
        if (index !== -1) {
          state.visualizations[index] = action.payload;
        }
        if (state.currentVisualization?.id === action.payload.id) {
          state.currentVisualization = action.payload;
        }
      })
      .addCase(deleteVisualization.fulfilled, (state, action) => {
        state.visualizations = state.visualizations.filter(v => v.id !== action.payload);
        if (state.currentVisualization?.id === action.payload) {
          state.currentVisualization = null;
        }
      })
      .addCase(updateDataMappings.fulfilled, (state, action) => {
        const visualization = state.visualizations.find(v => v.id === action.payload.id);
        if (visualization) {
          visualization.dataMappings = action.payload.dataMappings;
        }
        if (state.currentVisualization?.id === action.payload.id) {
          state.currentVisualization = {
            ...state.currentVisualization,
            dataMappings: action.payload.dataMappings,
          };
        }
      })
      .addCase(updateStreamConfig.fulfilled, (state, action) => {
        const visualization = state.visualizations.find(v => v.id === action.payload.id);
        if (visualization) {
          visualization.streamConfig = action.payload.streamConfig;
        }
        if (state.currentVisualization?.id === action.payload.id) {
          state.currentVisualization = {
            ...state.currentVisualization,
            streamConfig: action.payload.streamConfig,
          };
        }
      });
  },
});

export const {
  setCurrentVisualization,
  addVisualization,
  updateVisualizationState,
  deleteVisualizationState,
  setIsPlaying,
  addObject,
  updateObject,
  deleteObject,
} = visualizationSlice.actions;

export const selectVisualizationState = state => state.visualization;
export const selectVisualizations = state => state.visualization.visualizations;
export const selectCurrentVisualization = state => state.visualization.currentVisualization;
export const selectIsPlaying = state => state.visualization.isPlaying;
export const selectLoading = state => state.visualization.loading;
export const selectError = state => state.visualization.error;

export default visualizationSlice.reducer;
