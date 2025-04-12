/**
 * Audio Service
 * Handles operations related to audio in the application
 */

import { httpClient } from './http-client';
import { audioEndpoints } from './endpoints';
import { responseHandler } from './response-handler';

/**
 * Get all audio tracks
 * @param {Object} filters - Optional filters
 * @returns {Promise<object>} - List of audio tracks
 */
export const getAudioTracks = async (filters = {}) => {
  try {
    const response = await httpClient.get(audioEndpoints.list, { params: filters });
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('audio', 'Error fetching audio tracks', { error: error.message });
    return responseHandler.handleError(error);
  }
};

/**
 * Get a specific audio track by ID
 * @param {number|string} audioId - Audio track ID
 * @returns {Promise<object>} - Audio track details
 */
export const getAudioTrack = async (audioId) => {
  try {
    if (!audioId) {
      return responseHandler.handleError(new Error('Audio ID is required'));
    }

    const response = await httpClient.get(audioEndpoints.get(audioId));
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('audio', 'Error fetching audio track', { 
      audioId, 
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Create a new audio track
 * @param {object} audioData - Audio track data
 * @returns {Promise<object>} - Created audio track
 */
export const createAudioTrack = async (audioData) => {
  try {
    if (!audioData) {
      return responseHandler.handleError(new Error('Audio data is required'));
    }

    const response = await httpClient.post(audioEndpoints.create, audioData);
    
    console.log('audio', 'Audio track created successfully');
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('audio', 'Error creating audio track', { error: error.message });
    return responseHandler.handleError(error);
  }
};

/**
 * Update an existing audio track
 * @param {number|string} audioId - Audio track ID
 * @param {object} audioData - Updated audio track data
 * @returns {Promise<object>} - Updated audio track
 */
export const updateAudioTrack = async (audioId, audioData) => {
  try {
    if (!audioId) {
      return responseHandler.handleError(new Error('Audio ID is required'));
    }
    
    if (!audioData) {
      return responseHandler.handleError(new Error('Audio data is required'));
    }

    const response = await httpClient.put(audioEndpoints.update(audioId), audioData);
    
    console.log('audio', 'Audio track updated successfully', { audioId });
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('audio', 'Error updating audio track', { 
      audioId, 
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Delete an audio track
 * @param {number|string} audioId - Audio track ID
 * @returns {Promise<object>} - Deletion response
 */
export const deleteAudioTrack = async (audioId) => {
  try {
    if (!audioId) {
      return responseHandler.handleError(new Error('Audio ID is required'));
    }

    const response = await httpClient.delete(audioEndpoints.delete(audioId));
    
    console.log('audio', 'Audio track deleted successfully', { audioId });
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('audio', 'Error deleting audio track', { 
      audioId, 
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Get audio tracks for a specific universe
 * @param {number|string} universeId - Universe ID
 * @returns {Promise<object>} - List of audio tracks for the universe
 */
export const getAudioTracksByUniverse = async (universeId) => {
  try {
    if (!universeId) {
      return responseHandler.handleError(new Error('Universe ID is required'));
    }

    const response = await httpClient.get(audioEndpoints.forUniverse(universeId));
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('audio', 'Error fetching universe audio tracks', { 
      universeId, 
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Get audio tracks for a specific scene
 * @param {number|string} sceneId - Scene ID
 * @returns {Promise<object>} - List of audio tracks for the scene
 */
export const getAudioTracksByScene = async (sceneId) => {
  try {
    if (!sceneId) {
      return responseHandler.handleError(new Error('Scene ID is required'));
    }

    const response = await httpClient.get(audioEndpoints.forScene(sceneId));
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('audio', 'Error fetching scene audio tracks', { 
      sceneId, 
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Generate music based on parameters
 * @param {object} params - Music generation parameters
 * @returns {Promise<object>} - Generated music data
 */
export const generateMusic = async (params) => {
  try {
    if (!params) {
      return responseHandler.handleError(new Error('Generation parameters are required'));
    }

    const response = await httpClient.post(audioEndpoints.generate, params);
    
    console.log('audio', 'Music generated successfully');
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('audio', 'Error generating music', { error: error.message });
    return responseHandler.handleError(error);
  }
};

/**
 * Download a music file
 * @param {number|string} audioId - Audio track ID to download
 * @param {string} format - Download format (mp3, wav, etc.)
 * @returns {Promise<object>} - Download URL or binary data
 */
export const downloadMusic = async (audioId, format = 'mp3') => {
  try {
    if (!audioId) {
      return responseHandler.handleError(new Error('Audio ID is required'));
    }

    const response = await httpClient.get(audioEndpoints.download(audioId, format), {
      responseType: 'blob'
    });
    
    console.log('audio', 'Music downloaded successfully', { audioId, format });
    return responseHandler.handleSuccess(response);
  } catch (error) {
    console.log('audio', 'Error downloading music', { 
      audioId, 
      format,
      error: error.message 
    });
    return responseHandler.handleError(error);
  }
};

/**
 * Audio service object
 */
export const audioService = {
  getAudioTracks,
  getAudioTrack,
  createAudioTrack,
  updateAudioTrack,
  deleteAudioTrack,
  getAudioTracksByUniverse,
  getAudioTracksByScene,
  generateMusic,
  downloadMusic
};

export default audioService;
