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
  async (_, { signal, rejectWithValue }) => {
    try {
      console.debug('Fetching universes from API...');
      const response = await api.get(endpoints.universes.list, { signal });
      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch universes request was aborted');
        return rejectWithValue({ message: 'Request aborted' });
      }
      return rejectWithValue(handleError(error));
    }
  }
);

// Fetch a single universe by ID
export const fetchUniverseById = createAsyncThunk(
  'universe/fetchUniverseById',
  async (id, { signal, rejectWithValue }) => {
    try {
      console.debug(`Fetching universe ${id} from API...`);
      const response = await api.get(endpoints.universes.detail(id), { signal });
      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch universe request was aborted');
        return rejectWithValue({ message: 'Request aborted' });
      }
      return rejectWithValue(handleError(error));
    }
  }
);

// Create a new universe
export const createUniverse = createAsyncThunk(
  'universe/createUniverse',
  async (universeData, { rejectWithValue }) => {
    try {
      console.debug('Creating universe with data:', universeData);
      console.debug('Using endpoint:', endpoints.universes.create);

      // Log the auth token availability
      const token = localStorage.getItem('accessToken');
      console.debug('Access token available:', !!token);

      const response = await api.post(endpoints.universes.create, universeData);
      console.debug('Universe created successfully:', response);
      return response;
    } catch (error) {
      console.error('Failed to create universe:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : 'No response object'
      });
      return rejectWithValue(handleError(error));
    }
  }
);

// Update an existing universe
export const updateUniverse = createAsyncThunk(
  'universe/updateUniverse',
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      console.debug('Updating universe:', { id, data });
      console.debug('Original update data:', data);

      // Include name, description, theme, and map visibility to is_public
      const requestData = {
        name: data.name,
        description: data.description,
        theme: data.theme || "fantasy", // Include theme field with default
        is_public: data.visibility === 'public' // Map visibility to is_public
      };

      console.debug('Formatted update data:', requestData);
      console.debug('Sending to endpoint:', endpoints.universes.update(id));

      const response = await api.put(
        endpoints.universes.update(id),
        requestData
      );
      console.debug('Universe updated:', response);
      return response;
    } catch (error) {
      console.error('Failed to update universe:', error);
      if (error.response) {
        console.error('Error response:', error.response);
        console.error('Error details:', error.response.data);
      }
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

export const updateHarmonyParams = createAsyncThunk(
  'universes/updateHarmonyParams',
  async ({ universeId, harmonyParams }, { rejectWithValue }) => {
    try {
      const response = await api.put(
        endpoints.universes.harmony(universeId),
        harmonyParams
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update harmony parameters'
      );
    }
  }
);

// Delete a universe
export const deleteUniverse = createAsyncThunk(
  'universe/deleteUniverse',
  async (universeId, { rejectWithValue }) => {
    try {
      await api.delete(endpoints.universes.delete(universeId));
      // Always return the universeId on successful deletion
      return universeId;
    } catch (error) {
      console.error('Delete universe error:', error);
      return rejectWithValue({
        status: error.response?.status,
        message: error.response?.data?.message || 'Failed to delete universe',
      });
    }
  }
);
