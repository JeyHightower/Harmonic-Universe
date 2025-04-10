/**
 * Music API Service
 * Handles all music-related API requests
 */

import httpService from './httpService';
import { formatUrl } from './utilityApi';

// Base endpoints for music API
const ENDPOINTS = {
  GENERATE: '/universes/:universeId/generate-music',
  SAVE: '/universes/:universeId/save-music',
  LIST: '/universes/:universeId/music',
  GET: '/universes/:universeId/music/:musicId',
  UPDATE: '/universes/:universeId/music/:musicId',
  DELETE: '/universes/:universeId/music/:musicId',
  DOWNLOAD: '/universes/:universeId/download-music',
};

/**
 * Format endpoint with parameters
 * @param {string} endpoint - Endpoint template
 * @param {Object} params - Parameters to replace in the template
 * @returns {string} Formatted endpoint
 */
const formatEndpoint = (endpoint, params = {}) => {
  let formattedEndpoint = endpoint;
  
  // Replace parameters in the endpoint
  Object.keys(params).forEach(key => {
    formattedEndpoint = formattedEndpoint.replace(`:${key}`, params[key]);
  });
  
  return formattedEndpoint;
};

/**
 * Generate music based on parameters
 * @param {number} universeId - Universe ID
 * @param {Object} params - Music generation parameters
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Generated music data
 */
export const generateMusic = async (universeId, params = {}, options = {}) => {
  const endpoint = formatEndpoint(ENDPOINTS.GENERATE, { universeId });
  
  // Convert params to query string
  let queryParams = '';
  if (params && Object.keys(params).length > 0) {
    queryParams = `?custom_params=${encodeURIComponent(JSON.stringify(params))}`;
    
    // Add AI style if present
    if (params.ai_style) {
      queryParams += `&ai_style=${encodeURIComponent(params.ai_style)}`;
    }
  }
  
  return httpService.get(`${endpoint}${queryParams}`, options);
};

/**
 * Save generated music
 * @param {number} universeId - Universe ID
 * @param {Object} musicData - Music data to save
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Saved music data
 */
export const saveMusic = async (universeId, musicData, options = {}) => {
  const endpoint = formatEndpoint(ENDPOINTS.SAVE, { universeId });
  return httpService.post(endpoint, musicData, options);
};

/**
 * Get list of music for a universe
 * @param {number} universeId - Universe ID
 * @param {Object} params - Query parameters
 * @param {Object} options - Request options
 * @returns {Promise<Array>} List of music
 */
export const listMusic = async (universeId, params = {}, options = {}) => {
  const endpoint = formatEndpoint(ENDPOINTS.LIST, { universeId });
  return httpService.get(endpoint, { params, ...options });
};

/**
 * Get music by ID
 * @param {number} universeId - Universe ID
 * @param {number} musicId - Music ID
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Music data
 */
export const getMusic = async (universeId, musicId, options = {}) => {
  const endpoint = formatEndpoint(ENDPOINTS.GET, { universeId, musicId });
  return httpService.get(endpoint, options);
};

/**
 * Update music
 * @param {number} universeId - Universe ID
 * @param {number} musicId - Music ID
 * @param {Object} musicData - Updated music data
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Updated music data
 */
export const updateMusic = async (universeId, musicId, musicData, options = {}) => {
  const endpoint = formatEndpoint(ENDPOINTS.UPDATE, { universeId, musicId });
  return httpService.put(endpoint, musicData, options);
};

/**
 * Delete music
 * @param {number} universeId - Universe ID
 * @param {number} musicId - Music ID
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Delete response
 */
export const deleteMusic = async (universeId, musicId, options = {}) => {
  const endpoint = formatEndpoint(ENDPOINTS.DELETE, { universeId, musicId });
  return httpService.delete(endpoint, options);
};

/**
 * Download music as audio file
 * @param {number} universeId - Universe ID
 * @param {Object} musicData - Music data
 * @param {string} format - Audio format (mp3, wav)
 * @param {Object} options - Request options
 * @returns {Promise<Blob>} Audio file blob
 */
export const downloadMusic = async (universeId, musicData, format = 'mp3', options = {}) => {
  const endpoint = formatEndpoint(ENDPOINTS.DOWNLOAD, { universeId });
  return httpService.post(endpoint, {
    music_data: musicData,
    format
  }, {
    responseType: 'blob',
    ...options
  });
};

/**
 * Convert music notes to audio
 * @param {Array} notes - Music notes array
 * @param {Object} params - Conversion parameters
 * @param {Object} options - Request options
 * @returns {Promise<Blob>} Audio file blob
 */
export const convertToAudio = async (notes, params = {}, options = {}) => {
  return httpService.post(formatUrl('music/convert'), {
    notes,
    ...params
  }, {
    responseType: 'blob',
    ...options
  });
};

export default {
  generateMusic,
  saveMusic,
  listMusic,
  getMusic,
  updateMusic,
  deleteMusic,
  downloadMusic,
  convertToAudio
}; 