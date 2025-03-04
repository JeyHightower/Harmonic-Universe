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

/**
 * Fetch all scenes for a universe
 */
export const fetchScenes = createAsyncThunk(
    'scenes/fetchScenes',
    async (universeId, { rejectWithValue }) => {
        try {
            console.log(`Fetching scenes for universe ${universeId}`);
            const response = await api.scenes.list(universeId);
            return response.data;
        } catch (error) {
            console.error('Error fetching scenes:', error);
            return rejectWithValue(
                error.response?.data || { message: 'Failed to fetch scenes' }
            );
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
            console.log(`Fetching scene with ID ${sceneId}`);
            const response = await api.scenes.detail(sceneId);
            return response.data;
        } catch (error) {
            console.error('Error fetching scene:', error);
            return rejectWithValue(
                error.response?.data || { message: 'Failed to fetch scene details' }
            );
        }
    }
);

/**
 * Create a new scene
 */
export const createScene = createAsyncThunk(
    'scenes/createScene',
    async ({ universeId, ...sceneData }, { rejectWithValue }) => {
        try {
            console.log('Creating new scene:', sceneData);
            console.log('For universe:', universeId);

            const response = await api.scenes.create(universeId, sceneData);
            return response.data;
        } catch (error) {
            console.error('Error creating scene:', error);
            return rejectWithValue(
                error.response?.data || { message: 'Failed to create scene' }
            );
        }
    }
);

/**
 * Update an existing scene
 */
export const updateScene = createAsyncThunk(
    'scenes/updateScene',
    async ({ sceneId, data }, { rejectWithValue }) => {
        try {
            console.log(`Updating scene ${sceneId} with data:`, data);

            const response = await api.scenes.update(sceneId, data);
            return response.data;
        } catch (error) {
            console.error('Error updating scene:', error);
            return rejectWithValue(
                error.response?.data || { message: 'Failed to update scene' }
            );
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
            console.log(`Deleting scene ${sceneId}`);

            await api.scenes.delete(sceneId);
            return sceneId; // Return the ID for the reducer to filter it out
        } catch (error) {
            console.error('Error deleting scene:', error);
            return rejectWithValue(
                error.response?.data || { message: 'Failed to delete scene' }
            );
        }
    }
);

/**
 * Reorder scenes within a universe
 */
export const reorderScenes = createAsyncThunk(
    'scenes/reorderScenes',
    async ({ universeId, sceneOrders }, { rejectWithValue }) => {
        try {
            console.log(`Reordering scenes for universe ${universeId}:`, sceneOrders);

            const response = await api.scenes.reorder(universeId, sceneOrders);
            return response.data;
        } catch (error) {
            console.error('Error reordering scenes:', error);
            return rejectWithValue(
                error.response?.data || { message: 'Failed to reorder scenes' }
            );
        }
    }
);
