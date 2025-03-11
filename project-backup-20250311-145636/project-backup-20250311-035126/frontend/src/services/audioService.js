import { API_CONFIG } from '../utils/config';
import { handleApiError } from '../utils/errorHandling';

/**
 * Fetch audio details by ID
 * @param {string} audioId - The ID of the audio to fetch
 * @param {string} universeId - The ID of the universe
 * @param {string} sceneId - The ID of the scene
 * @returns {Promise<Object>} - The audio details
 */
export const fetchAudioDetails = async (audioId, universeId, sceneId) => {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/universes/${universeId}/scenes/${sceneId}/audio/${audioId}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch audio details: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Fetch all audio for a scene
 * @param {string} universeId - The ID of the universe
 * @param {string} sceneId - The ID of the scene
 * @returns {Promise<Array>} - Array of audio objects
 */
export const fetchSceneAudio = async (universeId, sceneId) => {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/universes/${universeId}/scenes/${sceneId}/audio`);

        if (!response.ok) {
            throw new Error(`Failed to fetch scene audio: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Generate or update audio based on parameters
 * @param {Object} params - Audio generation parameters
 * @returns {Promise<Object>} - The generated audio details
 */
export const fetchAudioByParams = async (params) => {
    try {
        const { id, universe_id, scene_id, ...audioParams } = params;
        const isUpdate = !!id;

        const url = isUpdate
            ? `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/universes/${universe_id}/scenes/${scene_id}/audio/${id}`
            : `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/universes/${universe_id}/scenes/${scene_id}/audio`;

        const response = await fetch(url, {
            method: isUpdate ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(audioParams),
        });

        if (!response.ok) {
            throw new Error(`Failed to ${isUpdate ? 'update' : 'generate'} audio: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Delete an audio track
 * @param {string} audioId - The ID of the audio to delete
 * @param {string} universeId - The ID of the universe
 * @param {string} sceneId - The ID of the scene
 * @returns {Promise<void>}
 */
export const deleteAudio = async (audioId, universeId, sceneId) => {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/universes/${universeId}/scenes/${sceneId}/audio/${audioId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to delete audio: ${response.statusText}`);
        }

        return true;
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Download audio file
 * @param {string} audioId - The ID of the audio to download
 * @param {string} universeId - The ID of the universe
 * @param {string} sceneId - The ID of the scene
 * @param {string} filename - The filename to save as
 * @returns {Promise<void>}
 */
export const downloadAudio = async (audioId, universeId, sceneId, filename) => {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/universes/${universeId}/scenes/${sceneId}/audio/${audioId}/download`);

        if (!response.ok) {
            throw new Error(`Failed to download audio: ${response.statusText}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename || `audio-${audioId}.wav`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        throw handleApiError(error);
    }
};
