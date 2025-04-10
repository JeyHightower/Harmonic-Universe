/**
 * Audio API Service
 * Handles all audio-related API requests
 */

import httpService from './httpService';
import { formatUrl } from './utilityApi';

// Base endpoints for audio API
const ENDPOINTS = {
  GENERATE: 'audio/generate',
  SAVE: 'audio/save',
  LIST: 'audio/list',
  GET: 'audio/get',
  UPDATE: 'audio/update',
  DELETE: 'audio/delete',
  FAVORITE: 'audio/favorite',
  UNFAVORITE: 'audio/unfavorite',
  FAVORITES: 'audio/favorites',
  UPLOAD: 'audio/upload',
  DOWNLOAD: 'audio/download',
  CONVERT: 'audio/convert'
};

/**
 * Generate audio based on parameters
 * @param {Object} params - Audio generation parameters
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Generated audio data
 */
export const generateAudio = async (params, options = {}) => {
  return httpService.post(formatUrl(ENDPOINTS.GENERATE), params, options);
};

/**
 * Save generated audio
 * @param {Object} audioData - Audio data to save
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Saved audio data
 */
export const saveAudio = async (audioData, options = {}) => {
  return httpService.post(formatUrl(ENDPOINTS.SAVE), audioData, options);
};

/**
 * Get list of audio samples
 * @param {Object} params - Query parameters
 * @param {Object} options - Request options
 * @returns {Promise<Array>} List of audio samples
 */
export const listAudio = async (params = {}, options = {}) => {
  return httpService.get(formatUrl(ENDPOINTS.LIST), { params, ...options });
};

/**
 * Get audio by ID
 * @param {string} id - Audio ID
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Audio data
 */
export const getAudio = async (id, options = {}) => {
  return httpService.get(formatUrl(`${ENDPOINTS.GET}/${id}`), options);
};

/**
 * Update audio
 * @param {string} id - Audio ID
 * @param {Object} audioData - Updated audio data
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Updated audio data
 */
export const updateAudio = async (id, audioData, options = {}) => {
  return httpService.put(formatUrl(`${ENDPOINTS.UPDATE}/${id}`), audioData, options);
};

/**
 * Delete audio
 * @param {string} id - Audio ID
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Delete response
 */
export const deleteAudio = async (id, options = {}) => {
  return httpService.delete(formatUrl(`${ENDPOINTS.DELETE}/${id}`), options);
};

/**
 * Add audio to favorites
 * @param {string} id - Audio ID
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Favorite response
 */
export const favoriteAudio = async (id, options = {}) => {
  return httpService.post(formatUrl(`${ENDPOINTS.FAVORITE}/${id}`), {}, options);
};

/**
 * Remove audio from favorites
 * @param {string} id - Audio ID
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Unfavorite response
 */
export const unfavoriteAudio = async (id, options = {}) => {
  return httpService.post(formatUrl(`${ENDPOINTS.UNFAVORITE}/${id}`), {}, options);
};

/**
 * Get list of favorite audio samples
 * @param {Object} params - Query parameters
 * @param {Object} options - Request options
 * @returns {Promise<Array>} List of favorite audio
 */
export const getFavorites = async (params = {}, options = {}) => {
  return httpService.get(formatUrl(ENDPOINTS.FAVORITES), { params, ...options });
};

/**
 * Upload audio file
 * @param {File} file - Audio file to upload
 * @param {Object} metadata - Audio metadata
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Uploaded audio data
 */
export const uploadAudio = async (file, metadata = {}, options = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  
  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }
  
  return httpService.post(formatUrl(ENDPOINTS.UPLOAD), formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...options
  });
};

/**
 * Download audio file
 * @param {string} id - Audio ID
 * @param {string} format - Audio format (mp3, wav, etc.)
 * @param {Object} options - Request options
 * @returns {Promise<Blob>} Audio file blob
 */
export const downloadAudio = async (id, format = 'mp3', options = {}) => {
  return httpService.get(formatUrl(`${ENDPOINTS.DOWNLOAD}/${id}`), {
    params: { format },
    responseType: 'blob',
    ...options
  });
};

/**
 * Convert audio to a different format
 * @param {string} id - Audio ID
 * @param {string} format - Target format (mp3, wav, etc.)
 * @param {Object} options - Request options
 * @returns {Promise<Blob>} Converted audio file blob
 */
export const convertAudio = async (id, format = 'mp3', options = {}) => {
  return httpService.get(formatUrl(`${ENDPOINTS.CONVERT}/${id}`), {
    params: { format },
    responseType: 'blob',
    ...options
  });
};

// Export the audio API
export const audioApi = {
  generateAudio,
  saveAudio,
  listAudio,
  getAudio,
  updateAudio,
  deleteAudio,
  favoriteAudio,
  unfavoriteAudio,
  getFavorites,
  uploadAudio,
  downloadAudio,
  convertAudio
};

// Default export
export default audioApi; 