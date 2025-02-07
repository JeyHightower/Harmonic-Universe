import api from '@/services/api';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

export interface AIModel {
  id: number;
  name: string;
  description: string;
  type: string;
  status: string;
  version: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  deployment: {
    status: string;
    endpoint: string | null;
    metrics?: { [key: string]: any };
  };
  training: {
    status: string;
    progress: number;
    metrics?: { [key: string]: any };
    error?: string;
  };
  datasets: Array<{
    id: number;
    name: string;
    description: string;
    type: string;
    metadata: {
      features: string[];
      target?: string;
      format: string;
      schema: { [key: string]: string };
    };
  }>;
  experiments: Array<{
    id: number;
    name: string;
    description: string;
    status: string;
    config: {
      hyperparameters: { [key: string]: any };
      tags?: string[];
    };
    metrics?: { [key: string]: any };
    error?: string;
  }>;
}

interface AIState {
  models: AIModel[];
  currentModel: AIModel | null;
  loading: boolean;
  error: string | null;
}

const initialState: AIState = {
  models: [],
  currentModel: null,
  loading: false,
  error: null,
};

// Thunks
export const fetchModels = createAsyncThunk('ai/fetchModels', async () => {
  const response = await api.get('/api/ai/models');
  return response.data;
});

export const createModel = createAsyncThunk(
  'ai/createModel',
  async (data: { name: string; description: string; type: string }) => {
    const response = await api.post('/api/ai/models', data);
    return response.data;
  }
);

export const updateModel = createAsyncThunk(
  'ai/updateModel',
  async (data: Partial<AIModel> & { id: number }) => {
    const response = await api.put(`/api/ai/models/${data.id}`, data);
    return response.data;
  }
);

export const deleteModel = createAsyncThunk('ai/deleteModel', async (id: number) => {
  await api.delete(`/api/ai/models/${id}`);
  return id;
});

export const startTraining = createAsyncThunk('ai/startTraining', async (modelId: number) => {
  const response = await api.post(`/api/ai/models/${modelId}/training/start`);
  return response.data;
});

export const stopTraining = createAsyncThunk('ai/stopTraining', async (modelId: number) => {
  const response = await api.post(`/api/ai/models/${modelId}/training/stop`);
  return response.data;
});

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setCurrentModel: (state, action: PayloadAction<AIModel | null>) => {
      state.currentModel = action.payload;
    },
  },
  extraReducers: builder => {
    builder
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
      .addCase(createModel.fulfilled, (state, action) => {
        state.models.push(action.payload);
      })
      .addCase(updateModel.fulfilled, (state, action) => {
        const index = state.models.findIndex(model => model.id === action.payload.id);
        if (index !== -1) {
          state.models[index] = action.payload;
        }
      })
      .addCase(deleteModel.fulfilled, (state, action) => {
        state.models = state.models.filter(model => model.id !== action.payload);
        if (state.currentModel?.id === action.payload) {
          state.currentModel = null;
        }
      });
  },
});

export const { setCurrentModel } = aiSlice.actions;

// Selectors
export const selectAIState = (state: RootState) => state.ai;
export const selectModels = (state: RootState) => state.ai.models;
export const selectCurrentModel = (state: RootState) => state.ai.currentModel;
export const selectLoading = (state: RootState) => state.ai.loading;
export const selectError = (state: RootState) => state.ai.error;

export default aiSlice.reducer;
