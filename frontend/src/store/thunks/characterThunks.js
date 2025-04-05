import { createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/api';
import { requestWithRetry } from '../../utils/apiUtils';
import {
  setCharacters,
  setCurrentCharacter,
  addCharacter,
  updateCharacter,
  deleteCharacter,
  setLoading,
  setError,
} from '../slices/characterSlice';

// Fetch all characters for a scene with retry
export const fetchCharacters = (sceneId) => async (dispatch) => {
  try {
    dispatch(setLoading(true));

    // Use regular API client first
    try {
      const response = await apiClient.get(`/characters/scene/${sceneId}`);
      dispatch(setCharacters(response.data.characters));
    } catch (error) {
      // If we get rate limited, try with retry logic
      if (error.response?.status === 429) {
        console.log('Rate limited when fetching characters, trying with retry logic...');

        const response = await requestWithRetry({
          method: 'get',
          url: `${apiClient.defaults.baseURL}/characters/scene/${sceneId}`,
          headers: apiClient.defaults.headers,
          withCredentials: true
        });

        dispatch(setCharacters(response.data.characters));
      } else {
        // Re-throw other errors
        throw error;
      }
    }
  } catch (error) {
    dispatch(setError(error.response?.data?.message || 'Error fetching characters'));
  } finally {
    dispatch(setLoading(false));
  }
};

// Fetch a single character with retry
export const fetchCharacter = (characterId) => async (dispatch) => {
  try {
    dispatch(setLoading(true));

    // Use regular API client first
    try {
      const response = await apiClient.get(`/characters/${characterId}`);
      dispatch(setCurrentCharacter(response.data.character));
    } catch (error) {
      // If we get rate limited, try with retry logic
      if (error.response?.status === 429) {
        console.log('Rate limited when fetching character, trying with retry logic...');

        const response = await requestWithRetry({
          method: 'get',
          url: `${apiClient.defaults.baseURL}/characters/${characterId}`,
          headers: apiClient.defaults.headers,
          withCredentials: true
        });

        dispatch(setCurrentCharacter(response.data.character));
      } else {
        // Re-throw other errors
        throw error;
      }
    }
  } catch (error) {
    dispatch(setError(error.response?.data?.message || 'Error fetching character'));
  } finally {
    dispatch(setLoading(false));
  }
};

// Create a new character with retry
export const createCharacter = (characterData) => async (dispatch) => {
  try {
    dispatch(setLoading(true));

    let response;
    try {
      response = await apiClient.post('/characters', characterData);
    } catch (error) {
      // If we get rate limited, try with retry logic
      if (error.response?.status === 429) {
        console.log('Rate limited when creating character, trying with retry logic...');

        response = await requestWithRetry({
          method: 'post',
          url: `${apiClient.defaults.baseURL}/characters`,
          data: characterData,
          headers: apiClient.defaults.headers,
          withCredentials: true
        });
      } else {
        // Re-throw other errors
        throw error;
      }
    }

    dispatch(addCharacter(response.data.character));
    return response.data.character;
  } catch (error) {
    dispatch(setError(error.response?.data?.message || 'Error creating character'));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// Update a character with retry
export const updateCharacterById = (characterId, characterData) => async (dispatch) => {
  try {
    dispatch(setLoading(true));

    let response;
    try {
      response = await apiClient.put(`/characters/${characterId}`, characterData);
    } catch (error) {
      // If we get rate limited, try with retry logic
      if (error.response?.status === 429) {
        console.log('Rate limited when updating character, trying with retry logic...');

        response = await requestWithRetry({
          method: 'put',
          url: `${apiClient.defaults.baseURL}/characters/${characterId}`,
          data: characterData,
          headers: apiClient.defaults.headers,
          withCredentials: true
        });
      } else {
        // Re-throw other errors
        throw error;
      }
    }

    dispatch(updateCharacter(response.data.character));
    return response.data.character;
  } catch (error) {
    dispatch(setError(error.response?.data?.message || 'Error updating character'));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// Delete a character with retry
export const deleteCharacterById = (characterId) => async (dispatch) => {
  try {
    dispatch(setLoading(true));

    try {
      await apiClient.delete(`/characters/${characterId}`);
    } catch (error) {
      // If we get rate limited, try with retry logic
      if (error.response?.status === 429) {
        console.log('Rate limited when deleting character, trying with retry logic...');

        await requestWithRetry({
          method: 'delete',
          url: `${apiClient.defaults.baseURL}/characters/${characterId}`,
          headers: apiClient.defaults.headers,
          withCredentials: true
        });
      } else {
        // Re-throw other errors
        throw error;
      }
    }

    dispatch(deleteCharacter(characterId));
  } catch (error) {
    dispatch(setError(error.response?.data?.message || 'Error deleting character'));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
}; 