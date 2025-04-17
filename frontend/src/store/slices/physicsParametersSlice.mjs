import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { API_CONFIG } from "../../utils";
import httpClient from "../../services/http-client.mjs";

const API_URL = `${API_CONFIG.BASE_URL}/physics-parameters`;

// Async thunks
export const fetchPhysicsParameters = createAsyncThunk(
  "physicsParameters/fetchAll",
  async (universeId) => {
    const response = await httpClient.get(`${API_URL}/universe/${universeId}`);
    return response;
  }
);

export const createPhysicsParameters = createAsyncThunk(
  "physicsParameters/create",
  async (paramData) => {
    const response = await httpClient.post(API_URL, paramData);
    return response;
  }
);

export const updatePhysicsParameters = createAsyncThunk(
  "physicsParameters/update",
  async ({ id, ...paramData }) => {
    const response = await httpClient.put(`${API_URL}/${id}`, paramData);
    return response;
  }
);

export const deletePhysicsParameters = createAsyncThunk(
  "physicsParameters/delete",
  async (id) => {
    await httpClient.delete(`${API_URL}/${id}`);
    return id;
  }
);

export const validateParameters = createAsyncThunk(
  "physicsParameters/validate",
  async (paramData) => {
    const response = await httpClient.post(`${API_URL}/validate`, paramData);
    return response;
  }
);

export const fetchAllPresets = createAsyncThunk(
  "physicsParameters/fetchAllPresets",
  async (_, { rejectWithValue }) => {
    try {
      const response = await httpClient.get("/api/v1/presets");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const savePreset = createAsyncThunk(
  "physicsParameters/savePreset",
  async (presetData, { rejectWithValue }) => {
    try {
      const response = await httpClient.post("/api/v1/presets", presetData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const updatePreset = createAsyncThunk(
  "physicsParameters/updatePreset",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await httpClient.put(`/api/v1/presets/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const deletePreset = createAsyncThunk(
  "physicsParameters/deletePreset",
  async (id, { rejectWithValue }) => {
    try {
      const response = await httpClient.delete(`/api/v1/presets/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

const physicsParametersSlice = createSlice({
  name: "physicsParameters",
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
        const index = state.parameters.findIndex(
          (p) => p.id === action.payload.id
        );
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
        state.parameters = state.parameters.filter(
          (p) => p.id !== action.payload
        );
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
        state.validationStatus = {
          valid: false,
          message: action.error.message,
        };
      })

      // Fetch all presets
      .addCase(fetchAllPresets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllPresets.fulfilled, (state, action) => {
        state.loading = false;
        state.presets = action.payload;
      })
      .addCase(fetchAllPresets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Save preset
      .addCase(savePreset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(savePreset.fulfilled, (state, action) => {
        state.loading = false;
        state.presets.push(action.payload);
      })
      .addCase(savePreset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Update preset
      .addCase(updatePreset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePreset.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.presets.findIndex(
          (p) => p.id === action.payload.id
        );
        if (index !== -1) {
          state.presets[index] = action.payload;
        }
      })
      .addCase(updatePreset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Delete preset
      .addCase(deletePreset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePreset.fulfilled, (state, action) => {
        state.loading = false;
        state.presets = state.presets.filter(
          (p) => p.id !== action.payload
        );
      })
      .addCase(deletePreset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearError, clearValidationStatus } =
  physicsParametersSlice.actions;

export default physicsParametersSlice.reducer;
