import visualizationApi from '@/services/visualizationApi';
import {
  DataMapping,
  StreamConfig,
  Visualization,
  VisualizationFormData,
  VisualizationUpdateData,
} from '@/types/visualization';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

export interface VisualizationState {
  visualizations: Visualization[];
  currentVisualization: Visualization | null;
  isPlaying: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: VisualizationState = {
  visualizations: [],
  currentVisualization: null,
  isPlaying: false,
  loading: false,
  error: null,
};

export const fetchVisualizations = createAsyncThunk(
  'visualization/fetchAll',
  async (projectId: number) => {
    return visualizationApi.fetchAll(projectId);
  }
);

export const fetchVisualizationsByAudio = createAsyncThunk(
  'visualization/fetchByAudio',
  async (audioId: number) => {
    return visualizationApi.fetchByAudio(audioId);
  }
);

export const fetchVisualization = createAsyncThunk('visualization/fetchOne', async (id: number) => {
  return visualizationApi.fetchOne(id);
});

export const createVisualization = createAsyncThunk(
  'visualization/create',
  async ({
    projectId,
    audioId,
    data,
  }: {
    projectId: number;
    audioId: number;
    data: VisualizationFormData;
  }) => {
    return visualizationApi.create(projectId, audioId, data);
  }
);

export const updateVisualization = createAsyncThunk(
  'visualization/update',
  async ({ id, data }: { id: number; data: VisualizationUpdateData }) => {
    return visualizationApi.update(id, data);
  }
);

export const deleteVisualization = createAsyncThunk('visualization/delete', async (id: number) => {
  await visualizationApi.delete(id);
  return id;
});

export const updateDataMappings = createAsyncThunk(
  'visualization/updateDataMappings',
  async ({ id, dataMappings }: { id: number; dataMappings: DataMapping[] }) => {
    return visualizationApi.updateDataMappings(id, dataMappings);
  }
);

export const updateStreamConfig = createAsyncThunk(
  'visualization/updateStreamConfig',
  async ({ id, streamConfig }: { id: number; streamConfig: StreamConfig }) => {
    return visualizationApi.updateStreamConfig(id, streamConfig);
  }
);

const visualizationSlice = createSlice({
  name: 'visualization',
  initialState,
  reducers: {
    setCurrentVisualization: (state, action: PayloadAction<Visualization | null>) => {
      state.currentVisualization = action.payload;
    },
    addVisualization: (state, action: PayloadAction<Visualization>) => {
      state.visualizations.push(action.payload);
    },
    updateVisualization: (
      state,
      action: PayloadAction<Partial<Visualization> & { id: number }>
    ) => {
      const index = state.visualizations.findIndex(v => v.id === action.payload.id);
      if (index !== -1) {
        state.visualizations[index] = { ...state.visualizations[index], ...action.payload };
      }
    },
    deleteVisualization: (state, action: PayloadAction<number>) => {
      state.visualizations = state.visualizations.filter(v => v.id !== action.payload);
      if (state.currentVisualization?.id === action.payload) {
        state.currentVisualization = null;
      }
    },
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },
    addObject: (state, action: PayloadAction<{ visualizationId: number; object: any }>) => {
      const visualization = state.visualizations.find(v => v.id === action.payload.visualizationId);
      if (visualization) {
        visualization.objects.push(action.payload.object);
      }
    },
    updateObject: (
      state,
      action: PayloadAction<{
        visualizationId: number;
        objectId: number;
        updates: any;
      }>
    ) => {
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
    deleteObject: (state, action: PayloadAction<{ visualizationId: number; objectId: number }>) => {
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
  updateVisualization,
  deleteVisualization,
  setIsPlaying,
  addObject,
  updateObject,
  deleteObject,
} = visualizationSlice.actions;

export const selectVisualizationState = (state: RootState) => state.visualization;
export const selectVisualizations = (state: RootState) => state.visualization.visualizations;
export const selectCurrentVisualization = (state: RootState) =>
  state.visualization.currentVisualization;
export const selectIsPlaying = (state: RootState) => state.visualization.isPlaying;
export const selectLoading = (state: RootState) => state.visualization.loading;
export const selectError = (state: RootState) => state.visualization.error;

export default visualizationSlice.reducer;
