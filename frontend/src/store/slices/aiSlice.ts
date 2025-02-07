import axiosInstance from '@/services/api';
import { AIModel } from '@/types';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export interface TrainingSession {
  id: number;
  model_id: number;
  start_time: number;
  end_time?: number;
  status: string;
  hyperparameters: {
    [key: string]: any;
  };
  metrics: {
    [key: string]: any;
  };
  validation_results: {
    [key: string]: any;
  };
  error_message?: string;
}

export interface InferenceResult {
  id: number;
  model_id: number;
  timestamp: number;
  input_data: any;
  output_data: any;
  metrics: {
    [key: string]: any;
  };
  processing_time: number;
}

interface AIState {
  models: AIModel[];
  selectedModelId: number | null;
  loading: boolean;
  error: string | null;
}

const initialState: AIState = {
  models: [],
  selectedModelId: null,
  loading: false,
  error: null,
};

export const fetchModels = createAsyncThunk('ai/fetchModels', async () => {
  const response = await axiosInstance.get('/ai/models');
  return response.data;
});

export const createModel = createAsyncThunk(
  'ai/createModel',
  async (model: Omit<AIModel, 'id'>) => {
    const response = await axiosInstance.post('/ai/models', model);
    return response.data;
  }
);

export const updateModel = createAsyncThunk(
  'ai/updateModel',
  async ({ id, ...updates }: Partial<AIModel> & { id: number }) => {
    const response = await axiosInstance.patch(`/ai/models/${id}`, updates);
    return response.data;
  }
);

export const deleteModel = createAsyncThunk('ai/deleteModel', async (id: number) => {
  await axiosInstance.delete(`/ai/models/${id}`);
  return id;
});

export const startTraining = createAsyncThunk('ai/startTraining', async (modelId: number) => {
  const response = await axiosInstance.post(`/ai/models/${modelId}/train`);
  return response.data;
});

export const stopTraining = createAsyncThunk('ai/stopTraining', async (modelId: number) => {
  const response = await axiosInstance.post(`/ai/models/${modelId}/stop`);
  return response.data;
});

export const deployModel = createAsyncThunk(
  'ai/deployModel',
  async ({ id, config }: { id: number; config: any }) => {
    const response = await axiosInstance.post(`/ai/models/${id}/deploy`, config);
    return response.data;
  }
);

export const stopDeployment = createAsyncThunk('ai/stopDeployment', async (modelId: number) => {
  const response = await axiosInstance.post(`/ai/models/${modelId}/deployment/stop`);
  return response.data;
});

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setSelectedModel: (state, action) => {
      state.selectedModelId = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch Models
      .addCase(fetchModels.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModels.fulfilled, (state, action) => {
        state.loading = false;
        state.models = action.payload;
      })
      .addCase(fetchModels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch models';
      })
      // Create Model
      .addCase(createModel.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createModel.fulfilled, (state, action) => {
        state.loading = false;
        state.models.push(action.payload);
      })
      .addCase(createModel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create model';
      })
      // Update Model
      .addCase(updateModel.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateModel.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.models.findIndex(model => model.id === action.payload.id);
        if (index !== -1) {
          state.models[index] = action.payload;
        }
      })
      .addCase(updateModel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update model';
      })
      // Delete Model
      .addCase(deleteModel.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteModel.fulfilled, (state, action) => {
        state.loading = false;
        state.models = state.models.filter(model => model.id !== action.payload);
        if (state.selectedModelId === action.payload) {
          state.selectedModelId = null;
        }
      })
      .addCase(deleteModel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete model';
      })
      // Start Training
      .addCase(startTraining.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startTraining.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.models.findIndex(model => model.id === action.payload.id);
        if (index !== -1) {
          state.models[index] = {
            ...state.models[index],
            status: 'training',
          };
        }
      })
      .addCase(startTraining.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to start training';
      })
      // Stop Training
      .addCase(stopTraining.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(stopTraining.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.models.findIndex(model => model.id === action.payload.id);
        if (index !== -1) {
          state.models[index] = {
            ...state.models[index],
            status: 'ready',
          };
        }
      })
      .addCase(stopTraining.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to stop training';
      })
      // Deploy Model
      .addCase(deployModel.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deployModel.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.models.findIndex(model => model.id === action.payload.id);
        if (index !== -1) {
          state.models[index] = {
            ...state.models[index],
            deployment: action.payload.deployment,
          };
        }
      })
      .addCase(deployModel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to deploy model';
      })
      // Stop Deployment
      .addCase(stopDeployment.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(stopDeployment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.models.findIndex(model => model.id === action.payload.id);
        if (index !== -1) {
          state.models[index] = {
            ...state.models[index],
            deployment: {
              ...state.models[index].deployment,
              status: 'stopped',
            },
          };
        }
      })
      .addCase(stopDeployment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to stop deployment';
      });
  },
});

export const { setSelectedModel, clearError } = aiSlice.actions;
export default aiSlice.reducer;
