import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from './utils/localApi.js';

const handleError = error => {
    console.error('API Error:', error);
    return {
        message:
            error.response?.data?.message || error.message || 'An error occurred',
        status: error.response?.status,
        data: error.response?.data,
    };
};

// Helper function to normalize scene data (especially date fields)
const normalizeSceneData = (scene) => {
    if (!scene) return null;

    // Ensure dates are strings for consistent handling
    const normalized = {
        ...scene,
        created_at: scene.created_at ? scene.created_at.toString() : null,
        updated_at: scene.updated_at ? scene.updated_at.toString() : null
    };

    return normalized;
};

// Helper function to normalize scenes array
const normalizeScenes = (scenes) => {
    if (!scenes || !Array.isArray(scenes)) return [];
    return scenes.map(normalizeSceneData);
};

/**
 * Fetch all scenes
 */
export const fetchScenes = createAsyncThunk(
    'scenes/fetchScenes',
    async (universeId, { rejectWithValue }) => {
        try {
            console.log(`Fetching scenes for universe ${universeId}`);
            const response = await apiClient.getScenes(universeId);
            console.log("Got scenes response:", response);

            // Extract and normalize the data
            let scenes = [];

            if (response && response.data && Array.isArray(response.data.scenes)) {
                // Format: { data: { scenes: [...] } }
                scenes = normalizeScenes(response.data.scenes);
            } else if (response && Array.isArray(response.scenes)) {
                // Format: { scenes: [...] }
                scenes = normalizeScenes(response.scenes);
            } else if (response && typeof response === 'object' && response.status === 'success') {
                // Format from simple_app.py: { status: 'success', data: { scenes: [...] } }
                scenes = normalizeScenes(response.data?.scenes || []);
            } else if (Array.isArray(response)) {
                // Direct array format
                scenes = normalizeScenes(response);
            } else {
                console.error('Unexpected scenes response format:', response);
                scenes = [];
            }

            return { ...response, scenes };
        } catch (error) {
            console.error(`Error fetching scenes for universe ${universeId}:`, error);
            return rejectWithValue(handleError(error));
        }
    }
);

// Create an alias for fetchScenes to match the import in UniverseDetail.jsx
export const fetchScenesForUniverse = fetchScenes;

/**
 * Fetch a specific scene by ID
 */
export const fetchSceneById = createAsyncThunk(
    'scenes/fetchSceneById',
    async (sceneId, { rejectWithValue }) => {
        try {
            console.log(`Fetching scene ${sceneId}`);
            const response = await apiClient.getScene(sceneId);
            console.log("Got scene response:", response);

            // Normalize the scene data if present
            if (response && response.data && response.data.scene) {
                response.data.scene = normalizeSceneData(response.data.scene);
            } else if (response && response.scene) {
                response.scene = normalizeSceneData(response.scene);
            } else if (response && response.id) {
                // If the response itself is the scene
                return normalizeSceneData(response);
            }

            return response.data || response;
        } catch (error) {
            console.error(`Error fetching scene ${sceneId}:`, error);
            return rejectWithValue(handleError(error));
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
            console.log("Creating scene with data:", sceneData);
            const response = await apiClient.createScene(sceneData);
            console.log("Created scene response:", response);

            // Normalize the scene data if present
            if (response && response.data && response.data.scene) {
                response.data.scene = normalizeSceneData(response.data.scene);
            } else if (response && response.scene) {
                response.scene = normalizeSceneData(response.scene);
            } else if (response && response.id) {
                // If the response itself is the scene
                return normalizeSceneData(response);
            }

            return response.data || response;
        } catch (error) {
            console.error("Error creating scene:", error);
            return rejectWithValue(handleError(error));
        }
    }
);

/**
 * Update a scene
 */
export const updateScene = createAsyncThunk(
    'scenes/updateScene',
    async ({ id, ...updateData }, { rejectWithValue }) => {
        try {
            console.log(`Updating scene ${id} with data:`, updateData);
            const response = await apiClient.updateScene(id, updateData);
            console.log("Updated scene response:", response);

            // Normalize the scene data if present
            if (response && response.data && response.data.scene) {
                response.data.scene = normalizeSceneData(response.data.scene);
            } else if (response && response.scene) {
                response.scene = normalizeSceneData(response.scene);
            } else if (response && response.id) {
                // If the response itself is the scene
                return normalizeSceneData(response);
            }

            return response.data || response;
        } catch (error) {
            console.error(`Error updating scene ${id}:`, error);
            return rejectWithValue(handleError(error));
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
            await apiClient.deleteScene(sceneId);
            console.log(`Scene ${sceneId} deleted successfully`);
            return sceneId;
        } catch (error) {
            console.error(`Error deleting scene ${sceneId}:`, error);
            return rejectWithValue(handleError(error));
        }
    }
);

/**
 * Reorder scenes
 */
export const reorderScenes = createAsyncThunk(
    'scenes/reorderScenes',
    async ({ universeId, sceneOrders }, { rejectWithValue }) => {
        try {
            console.log(`Reordering scenes for universe ${universeId}:`, sceneOrders);

            // For simple backend, we can update each scene individually
            const updatePromises = sceneOrders.map(({ id, order }) =>
                apiClient.updateScene(id, { order })
            );

            await Promise.all(updatePromises);

            // Fetch updated scenes
            const response = await apiClient.getScenes(universeId);
            console.log("Got updated scenes after reordering:", response);

            // Extract and normalize the data
            let scenes = [];

            if (response && response.data && Array.isArray(response.data.scenes)) {
                scenes = normalizeScenes(response.data.scenes);
            } else if (response && Array.isArray(response.scenes)) {
                scenes = normalizeScenes(response.scenes);
            } else if (response && typeof response === 'object' && response.status === 'success') {
                scenes = normalizeScenes(response.data?.scenes || []);
            } else if (Array.isArray(response)) {
                scenes = normalizeScenes(response);
            } else {
                console.error('Unexpected scenes response format after reordering:', response);
                scenes = [];
            }

            return { ...response, scenes };
        } catch (error) {
            console.error(`Error reordering scenes for universe ${universeId}:`, error);
            return rejectWithValue(handleError(error));
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
            const response = await apiClient.updateScenePhysicsParams(sceneId, physicsParams);

            // Normalize the scene data if present
            if (response && response.data && response.data.scene) {
                response.data.scene = normalizeSceneData(response.data.scene);
            } else if (response && response.scene) {
                response.scene = normalizeSceneData(response.scene);
            } else if (response && response.id) {
                return normalizeSceneData(response);
            }

            return response;
        } catch (error) {
            return rejectWithValue(error);
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
            const response = await apiClient.updateSceneHarmonyParams(sceneId, harmonyParams);

            // Normalize the scene data if present
            if (response && response.data && response.data.scene) {
                response.data.scene = normalizeSceneData(response.data.scene);
            } else if (response && response.scene) {
                response.scene = normalizeSceneData(response.scene);
            } else if (response && response.id) {
                return normalizeSceneData(response);
            }

            return response;
        } catch (error) {
            return rejectWithValue(error);
        }
    }
);
