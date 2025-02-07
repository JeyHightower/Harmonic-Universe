/**
 * @typedef {Object} AIModelDeployment
 * @property {string} status
 * @property {string|null} endpoint
 * @property {Object} [metrics]
 */

/**
 * @typedef {Object} AIModelTraining
 * @property {string} status
 * @property {number} progress
 * @property {Object} [metrics]
 * @property {string} [error]
 */

/**
 * @typedef {Object} AIModelDataset
 * @property {number} id
 * @property {string} name
 * @property {string} description
 * @property {string} type
 * @property {Object} metadata
 * @property {string[]} metadata.features
 * @property {string} [metadata.target]
 * @property {string} metadata.format
 * @property {Object.<string, string>} metadata.schema
 */

/**
 * @typedef {Object} AIModelExperiment
 * @property {number} id
 * @property {string} name
 * @property {string} description
 * @property {string} status
 * @property {Object} config
 * @property {Object} config.hyperparameters
 * @property {string[]} [config.tags]
 * @property {Object} [metrics]
 * @property {string} [error]
 */

/**
 * @typedef {Object} AIModel
 * @property {number} id
 * @property {string} name
 * @property {string} description
 * @property {string} type
 * @property {string} status
 * @property {string} version
 * @property {number} userId
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {AIModelDeployment} deployment
 * @property {AIModelTraining} training
 * @property {AIModelDataset[]} datasets
 * @property {AIModelExperiment[]} experiments
 */

/**
 * @typedef {Object} AIState
 * @property {AIModel[]} models
 * @property {AIModel|null} currentModel
 * @property {boolean} loading
 * @property {string|null} error
 */

import api from '@/services/api';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const initialState = {
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
  async (data) => {
    const response = await api.post('/api/ai/models', data);
    return response.data;
  }
);

export const updateModel = createAsyncThunk(
  'ai/updateModel',
  async (data) => {
    const response = await api.put(`/api/ai/models/${data.id}`, data);
    return response.data;
  }
);

export const deleteModel = createAsyncThunk('ai/deleteModel', async (id) => {
  await api.delete(`/api/ai/models/${id}`);
  return id;
});

export const startTraining = createAsyncThunk('ai/startTraining', async (modelId) => {
  const response = await api.post(`/api/ai/models/${modelId}/training/start`);
  return response.data;
});

export const stopTraining = createAsyncThunk('ai/stopTraining', async (modelId) => {
  const response = await api.post(`/api/ai/models/${modelId}/training/stop`);
  return response.data;
});

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setCurrentModel: (state, action) => {
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
export const selectAIState = (state) => state.ai;
export const selectModels = (state) => state.ai.models;
export const selectCurrentModel = (state) => state.ai.currentModel;
export const selectLoading = (state) => state.ai.loading;
export const selectError = (state) => state.ai.error;

export default aiSlice.reducer;
