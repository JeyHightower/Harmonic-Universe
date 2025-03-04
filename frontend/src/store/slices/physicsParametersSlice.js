import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_CONFIG } from '../../utils/config';

const API_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/physics-parameters`;

// Async thunks
export const fetchPhysicsParameters = createAsyncThunk(
  'physicsParameters/fetchAll',
  async (universeId) => {
    const response = await axios.get(`${API_URL}/universe/${universeId}`);
    return response.data;
  }
);

export const createPhysicsParameters = createAsyncThunk(
  'physicsParameters/create',
  async (paramData) => {
    const response = await axios.post(API_URL, paramData);
    return response.data;
  }
);

export const updatePhysicsParameters = createAsyncThunk(
  'physicsParameters/update',
  async ({ id, ...paramData }) => {
    const response = await axios.put(`${API_URL}/${id}`, paramData);
    return response.data;
  }
);

export const deletePhysicsParameters = createAsyncThunk(
  'physicsParameters/delete',
  async (id) => {
    await axios.delete(`${API_URL}/${id}`);
    return id;
  }
);

export const validateParameters = createAsyncThunk(
  'physicsParameters/validate',
  async (paramData) => {
    const response = await axios.post(`${API_URL}/validate`, paramData);
    return response.data;
  }
);

const physicsParametersSlice = createSlice({
  name: 'physicsParameters',
  initialState: {
    parameters: [],
    loading: false,
    error: null,
    validationStatus: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearValidationStatus: (state) => {
      state.validationStatus = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch parameters
      .addCase(fetchPhysicsParameters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPhysicsParameters.fulfilled, (state, action) => {
        state.loading = false;
        state.parameters = action.payload;
      })
      .addCase(fetchPhysicsParameters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Create parameters
      .addCase(createPhysicsParameters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPhysicsParameters.fulfilled, (state, action) => {
        state.loading = false;
        state.parameters.push(action.payload);
      })
      .addCase(createPhysicsParameters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Update parameters
      .addCase(updatePhysicsParameters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePhysicsParameters.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.parameters.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.parameters[index] = action.payload;
        }
      })
      .addCase(updatePhysicsParameters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Delete parameters
      .addCase(deletePhysicsParameters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePhysicsParameters.fulfilled, (state, action) => {
        state.loading = false;
        state.parameters = state.parameters.filter(p => p.id !== action.payload);
      })
      .addCase(deletePhysicsParameters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Validate parameters
      .addCase(validateParameters.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.validationStatus = null;
      })
      .addCase(validateParameters.fulfilled, (state, action) => {
        state.loading = false;
        state.validationStatus = action.payload;
      })
      .addCase(validateParameters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        state.validationStatus = { valid: false, message: action.error.message };
      });
  },
});

export const { clearError, clearValidationStatus } = physicsParametersSlice.actions;

export default physicsParametersSlice.reducer;
