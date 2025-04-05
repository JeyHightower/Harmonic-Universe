import { createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/api';
import { requestWithRetry } from '../../utils/apiUtils';

// Helper function for error handling
const handleError = (error) => {
  console.error("API Error:", error);
  return {
    message:
      error.response?.data?.message || error.message || "An error occurred",
    status: error.response?.status,
    data: error.response?.data,
  };
};

// Fetch all characters for a scene
export const fetchCharacters = createAsyncThunk(
  'characters/fetchCharacters',
  async (sceneId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/characters/scene/${sceneId}`);
      return response.data.characters;
    } catch (error) {
      // If we get rate limited, try with retry logic
      if (error.response?.status === 429) {
        console.log('Rate limited when fetching characters, trying with retry logic...');
        try {
          const response = await requestWithRetry({
            method: 'get',
            url: `${apiClient.defaults.baseURL}/characters/scene/${sceneId}`,
            headers: apiClient.defaults.headers,
            withCredentials: true
          });
          return response.data.characters;
        } catch (retryError) {
          return rejectWithValue(handleError(retryError));
        }
      }
      return rejectWithValue(handleError(error));
    }
  }
);

// Fetch all characters for a universe
export const fetchCharactersByUniverse = createAsyncThunk(
  'characters/fetchCharactersByUniverse',
  async (universeId, { rejectWithValue }) => {
    try {
      // Validate universeId before making any API requests
      if (!universeId || universeId === undefined || universeId === 'undefined' || universeId === 'null') {
        console.error(`Redux: Invalid universe ID for fetching characters: ${universeId}`);
        return rejectWithValue(`Invalid universe ID: ${universeId}`);
      }

      // Ensure universeId is a number
      const parsedUniverseId = typeof universeId === 'string'
        ? parseInt(universeId, 10)
        : universeId;

      if (isNaN(parsedUniverseId) || parsedUniverseId <= 0) {
        console.error(`Redux: Invalid parsed universe ID: ${parsedUniverseId}`);
        return rejectWithValue(`Invalid universe ID format: ${universeId}`);
      }

      console.log(`Redux: Fetching characters for universe ${parsedUniverseId}`);
      const response = await apiClient.getCharactersByUniverse(parsedUniverseId);

      // Handle different response formats
      let characters = [];
      if (response.data && response.data.characters) {
        characters = response.data.characters;
      } else if (Array.isArray(response.data)) {
        characters = response.data;
      }

      console.log(`Redux: Found ${characters.length} characters for universe ${parsedUniverseId}`);
      return characters;
    } catch (error) {
      // If we get rate limited, try with retry logic
      if (error.response?.status === 429) {
        console.log('Rate limited when fetching characters by universe, trying with retry logic...');
        try {
          const response = await requestWithRetry({
            method: 'get',
            url: `/universes/${parsedUniverseId}/characters`,
          });

          let characters = [];
          if (response.data && response.data.characters) {
            characters = response.data.characters;
          } else if (Array.isArray(response.data)) {
            characters = response.data;
          }
          return characters;
        } catch (retryError) {
          console.error(`Error in retry for characters of universe ${universeId}:`, retryError);
          return rejectWithValue(handleError(retryError));
        }
      }
      const errorMessage = error.response?.data?.message || `Error fetching characters for universe ${universeId}`;
      console.error(errorMessage, error);
      return rejectWithValue(handleError(error));
    }
  }
);

// Fetch a single character
export const fetchCharacter = createAsyncThunk(
  'characters/fetchCharacter',
  async (characterId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/characters/${characterId}`);
      return response.data.character;
    } catch (error) {
      // If we get rate limited, try with retry logic
      if (error.response?.status === 429) {
        console.log('Rate limited when fetching character, trying with retry logic...');
        try {
          const response = await requestWithRetry({
            method: 'get',
            url: `${apiClient.defaults.baseURL}/characters/${characterId}`,
            headers: apiClient.defaults.headers,
            withCredentials: true
          });
          return response.data.character;
        } catch (retryError) {
          return rejectWithValue(handleError(retryError));
        }
      }
      return rejectWithValue(handleError(error));
    }
  }
);

// Create a new character
export const createCharacter = createAsyncThunk(
  'characters/createCharacter',
  async (characterData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/characters', characterData);
      return response.data.character;
    } catch (error) {
      // If we get rate limited, try with retry logic
      if (error.response?.status === 429) {
        console.log('Rate limited when creating character, trying with retry logic...');
        try {
          const response = await requestWithRetry({
            method: 'post',
            url: `${apiClient.defaults.baseURL}/characters`,
            data: characterData,
            headers: apiClient.defaults.headers,
            withCredentials: true
          });
          return response.data.character;
        } catch (retryError) {
          return rejectWithValue(handleError(retryError));
        }
      }
      return rejectWithValue(handleError(error));
    }
  }
);

// Update a character
export const updateCharacter = createAsyncThunk(
  'characters/updateCharacter',
  async ({ characterId, characterData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/characters/${characterId}`, characterData);
      return response.data.character;
    } catch (error) {
      // If we get rate limited, try with retry logic
      if (error.response?.status === 429) {
        console.log('Rate limited when updating character, trying with retry logic...');
        try {
          const response = await requestWithRetry({
            method: 'put',
            url: `${apiClient.defaults.baseURL}/characters/${characterId}`,
            data: characterData,
            headers: apiClient.defaults.headers,
            withCredentials: true
          });
          return response.data.character;
        } catch (retryError) {
          return rejectWithValue(handleError(retryError));
        }
      }
      return rejectWithValue(handleError(error));
    }
  }
);

// Delete a character
export const deleteCharacter = createAsyncThunk(
  'characters/deleteCharacter',
  async (characterId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/characters/${characterId}`);
      return characterId;
    } catch (error) {
      // If we get rate limited, try with retry logic
      if (error.response?.status === 429) {
        console.log('Rate limited when deleting character, trying with retry logic...');
        try {
          await requestWithRetry({
            method: 'delete',
            url: `${apiClient.defaults.baseURL}/characters/${characterId}`,
            headers: apiClient.defaults.headers,
            withCredentials: true
          });
          return characterId;
        } catch (retryError) {
          return rejectWithValue(handleError(retryError));
        }
      }
      return rejectWithValue(handleError(error));
    }
  }
); 