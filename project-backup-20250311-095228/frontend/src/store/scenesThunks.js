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

/**
 * Fetch all scenes for a universe
 */
export const fetchScenes = createAsyncThunk(
    'scenes/fetchScenes',
    async (params = {}, { rejectWithValue }) => {
        try {
            // Build query parameters
            const queryParams = new URLSearchParams();
            if (params.universeId) {
                queryParams.append('universe_id', params.universeId);
            }

            const response = await api.get(`/api/scenes/?${queryParams.toString()}`);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

/**
 * Fetch a single scene by ID
 */
export const fetchSceneById = createAsyncThunk(
    'scenes/fetchSceneById',
    async (sceneId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/api/scenes/${sceneId}`);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

/**
 * Create a new scene
 */
export const createScene = createAsyncThunk(
    'scenes/createScene',
    async (sceneData, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/scenes/', sceneData);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

/**
 * Update an existing scene
 */
export const updateScene = createAsyncThunk(
    'scenes/updateScene',
    async ({ id, ...updateData }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/api/scenes/${id}`, updateData);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

/**
 * Delete a scene
 */
export const deleteScene = createAsyncThunk(
    'scenes/deleteScene',
    async (sceneId, { rejectWithValue }) => {
        try {
            await api.delete(`/api/scenes/${sceneId}`);
            return sceneId;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

/**
 * Reorder scenes within a universe
 */
export const reorderScenes = createAsyncThunk(
    'scenes/reorderScenes',
    async ({ universeId, sceneOrder }, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/scenes/reorder', {
                universe_id: universeId,
                scene_order: sceneOrder
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

/**
 * Update physics parameters for a scene
 */
export const updateScenePhysicsParams = createAsyncThunk(
    'scenes/updatePhysicsParams',
    async ({ sceneId, physicsParams }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/api/scenes/${sceneId}/physics_parameters`, physicsParams);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

/**
 * Update harmony parameters for a scene
 */
export const updateSceneHarmonyParams = createAsyncThunk(
    'scenes/updateHarmonyParams',
    async ({ sceneId, harmonyParams }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/api/scenes/${sceneId}/harmony_parameters`, harmonyParams);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);
