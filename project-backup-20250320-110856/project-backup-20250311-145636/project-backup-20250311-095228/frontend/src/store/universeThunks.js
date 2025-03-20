import { createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../utils/api.js';

const handleError = error => {
  console.error('API Error:', error);
  return {
    message:
      error.response?.data?.message || error.message || 'An error occurred',
    status: error.response?.status,
    data: error.response?.data,
  };
};

// Fetch all universes
export const fetchUniverses = createAsyncThunk(
  'universe/fetchUniverses',
  async (params = {}, { rejectWithValue }) => {
    try {
      // Add public=true to get public universes as well, if requested
      const queryParams = new URLSearchParams();
      if (params.includePublic) {
        queryParams.append('public', 'true');
      }

      const response = await api.get(`/api/universes/?${queryParams.toString()}`);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch a specific universe by ID
export const fetchUniverseById = createAsyncThunk(
  'universe/fetchUniverseById',
  async ({ id, includeScenes = false }, { rejectWithValue }) => {
    try {
      // Add include_scenes=true to get scenes as well, if requested
      const queryParams = new URLSearchParams();
      if (includeScenes) {
        queryParams.append('include_scenes', 'true');
      }

      const response = await api.get(`/api/universes/${id}?${queryParams.toString()}`);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create a new universe
export const createUniverse = createAsyncThunk(
  'universe/createUniverse',
  async (universeData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/universes/', universeData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update an existing universe
export const updateUniverse = createAsyncThunk(
  'universe/updateUniverse',
  async ({ id, ...updateData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/universes/${id}`, updateData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete a universe
export const deleteUniverse = createAsyncThunk(
  'universe/deleteUniverse',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/universes/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch scenes for a specific universe
export const fetchScenesForUniverse = createAsyncThunk(
  'universe/fetchScenesForUniverse',
  async (universeId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/universes/${universeId}/scenes`);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update physics parameters
export const updatePhysicsParams = createAsyncThunk(
  'universe/updatePhysicsParams',
  async ({ universeId, physicsParams }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/universes/${universeId}/physics`, {
        physics_params: physicsParams
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update harmony parameters
export const updateHarmonyParams = createAsyncThunk(
  'universe/updateHarmonyParams',
  async ({ universeId, harmonyParams }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/universes/${universeId}/harmony`, {
        harmony_params: harmonyParams
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
