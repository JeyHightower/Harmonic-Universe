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
    // If universeId is provided in filters, use the tracks.list endpoint
    if (filters.universeId) {
      const response = await httpClient.get(audioEndpoints.tracks.list(filters.universeId), { 
        params: { ...filters, universeId: undefined } 
      });
      return responseHandler.handleSuccess(response);
    }
    
    // Otherwise, we need a general endpoint for all tracks
    // This might not exist in the API, so we'll log a warning
    console.log('audio', 'Warning: Fetching all audio tracks without universeId may not be supported');
    const response = await httpClient.get('/audio-tracks/', { params: filters });
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

    // Extract universeId from audioId or get it from the audioTrack
    // This is a temporary solution - we should get the actual universeId
    let universeId = 1; // Default fallback
    let trackId = audioId;
    
    if (String(audioId).includes('-')) {
      const parts = String(audioId).split('-');
      universeId = parts[0];
      trackId = parts[1];
    }

    const response = await httpClient.get(audioEndpoints.tracks.get(universeId, trackId));
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

    if (!audioData.universeId) {
      return responseHandler.handleError(new Error('Universe ID is required to create an audio track'));
    }

    const universeId = audioData.universeId;
    // Remove universeId from data if it's being sent in the URL
    const dataToSend = { ...audioData };
    delete dataToSend.universeId;

    const response = await httpClient.post(audioEndpoints.tracks.create(universeId), dataToSend);
    
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

    // Extract universeId from audioId or get it from the audioData
    let universeId = audioData.universeId || 1; // Default fallback
    let trackId = audioId;
    
    if (String(audioId).includes('-')) {
      const parts = String(audioId).split('-');
      universeId = parts[0];
      trackId = parts[1];
    }

    // Remove universeId from data if it's being sent in the URL
    const dataToSend = { ...audioData };
    delete dataToSend.universeId;

    const response = await httpClient.put(audioEndpoints.tracks.update(universeId, trackId), dataToSend);
    
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

    // Extract universeId from audioId or get it from the audioTrack
    // This is a temporary solution - we should get the actual universeId
    // For now we'll just use the first part of the ID if it contains a separator
    let universeId = 1; // Default fallback
    let trackId = audioId;
    
    if (String(audioId).includes('-')) {
      const parts = String(audioId).split('-');
      universeId = parts[0];
      trackId = parts[1];
    }

    const response = await httpClient.delete(audioEndpoints.tracks.delete(universeId, trackId));
    
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

    const response = await httpClient.get(audioEndpoints.tracks.list(universeId));
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

    const response = await httpClient.get(audioEndpoints.tracks.byScene(sceneId));
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

    if (!params.universeId) {
      return responseHandler.handleError(new Error('Universe ID is required for music generation'));
    }

    const response = await httpClient.post(audioEndpoints.generate(params.universeId), params);
    
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

    // Extract universeId from audioId or get it from the audioTrack
    // This is a temporary solution - we should get the actual universeId
    let universeId = 1; // Default fallback
    
    if (String(audioId).includes('-')) {
      const parts = String(audioId).split('-');
      universeId = parts[0];
    }

    // Add format as a query parameter
    const response = await httpClient.get(audioEndpoints.download(universeId), {
      responseType: 'blob',
      params: { format, audioId }
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
