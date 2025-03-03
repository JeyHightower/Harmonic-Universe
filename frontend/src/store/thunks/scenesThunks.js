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

// Fetch scenes for a universe
export const fetchScenes = createAsyncThunk(
    'scenes/fetchScenes',
    async (universeId, { rejectWithValue }) => {
        try {
            console.debug(`Fetching scenes for universe ${universeId}`);
            const response = await api.get(
                endpoints.scenes.forUniverse(universeId)
            );
            console.debug('Scenes fetched:', response);
            return response || [];
        } catch (error) {
            console.error('Failed to fetch scenes:', error);
            return rejectWithValue(handleError(error));
        }
    }
);

// Create a new scene
export const createScene = createAsyncThunk(
    'scenes/createScene',
    async (sceneData, { rejectWithValue }) => {
        try {
            console.debug('Creating scene:', sceneData);
            const response = await api.post(
                endpoints.scenes.create,
                sceneData
            );
            console.debug('Scene created:', response);
            return response;
        } catch (error) {
            console.error('Failed to create scene:', error);
            return rejectWithValue(handleError(error));
        }
    }
);

// Update a scene
export const updateScene = createAsyncThunk(
    'scenes/updateScene',
    async ({ id, ...data }, { rejectWithValue }) => {
        try {
            console.debug(`Updating scene ${id}:`, data);
            const response = await api.put(endpoints.scenes.update(id), data);
            console.debug('Scene updated:', response);
            return response;
        } catch (error) {
            console.error('Failed to update scene:', error);
            return rejectWithValue(handleError(error));
        }
    }
);

// Delete a scene
export const deleteScene = createAsyncThunk(
    'scenes/deleteScene',
    async (id, { rejectWithValue }) => {
        try {
            console.debug(`Deleting scene ${id}`);
            await api.delete(endpoints.scenes.delete(id));
            return id; // Return the ID for state updates
        } catch (error) {
            console.error('Failed to delete scene:', error);
            return rejectWithValue(handleError(error));
        }
    }
);
