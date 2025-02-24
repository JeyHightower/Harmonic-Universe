import { createAsyncThunk } from '@reduxjs/toolkit';
import { api, endpoints } from '../../utils/api';

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
  async (_, { rejectWithValue }) => {
    try {
      console.debug('Fetching universes from API...');
      const response = await api.get(endpoints.universes.list);
      console.debug('Universes fetched:', response);
      return response || [];
    } catch (error) {
      console.error('Failed to fetch universes:', error);
      return rejectWithValue(handleError(error));
    }
  }
);

// Create a new universe
export const createUniverse = createAsyncThunk(
  'universe/createUniverse',
  async (universeData, { rejectWithValue }) => {
    try {
      console.debug('Creating universe:', universeData);
      const response = await api.post(endpoints.universes.create, universeData);
      console.debug('Universe created:', response);
      return response;
    } catch (error) {
      console.error('Failed to create universe:', error);
      return rejectWithValue(handleError(error));
    }
  }
);

// Update an existing universe
export const updateUniverse = createAsyncThunk(
  'universe/updateUniverse',
  async ({ universeId, universeData }, { rejectWithValue }) => {
    try {
      console.debug('Updating universe:', { universeId, universeData });
      const response = await api.put(
        endpoints.universes.update(universeId),
        universeData
      );
      console.debug('Universe updated:', response);
      return response;
    } catch (error) {
      console.error('Failed to update universe:', error);
      return rejectWithValue(handleError(error));
    }
  }
);

export const updatePhysicsParams = createAsyncThunk(
  'universe/updatePhysics',
  async ({ universeId, physicsParams }, { rejectWithValue }) => {
    try {
      // Update physics parameters using the correct endpoint
      const response = await api.put(endpoints.universes.physics(universeId), {
        physics_params: physicsParams,
      });

      if (!response) {
        throw new Error('Failed to update physics parameters');
      }

      // Verify the update was successful by checking if we got a response with physics_params
      if (!response.physics_params) {
        throw new Error('Invalid response format');
      }

      return response;
    } catch (error) {
      console.error('Physics update failed:', error);
      if (error.response) {
        return rejectWithValue({
          status: error.response.status,
          message:
            error.response.data?.message ||
            'Failed to update physics parameters',
          error_code: error.response.data?.error_code,
          details: error.response.data?.details,
        });
      }
      return rejectWithValue({
        message: error.message || 'Failed to update physics parameters',
      });
    }
  }
);

// Delete a universe
export const deleteUniverse = createAsyncThunk(
  'universe/deleteUniverse',
  async (universeId, { rejectWithValue }) => {
    try {
      await api.delete(endpoints.universes.delete(universeId));
      return universeId;
    } catch (error) {
      // Don't log here since api.js already logs errors
      return rejectWithValue({
        status: error.response?.status,
        message:
          error.response?.data?.userMessage || error.response?.data?.message,
        error_code: error.response?.data?.error_code,
        isAuthorizationError: error.isAuthorizationError,
      });
    }
  }
);
