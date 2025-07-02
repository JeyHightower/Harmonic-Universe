import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../services/api.adapter.mjs';
import { API_MODAL_ROUTES } from '../../utils/routes';

const handleError = (error) => {
  console.error('API Error:', error);
  return {
    message: error.response?.data?.message || error.message || 'An error occurred',
    status: error.response?.status,
    data: error.response?.data,
  };
};

// Fetch all notes for a universe
export const fetchUniverseNotes = createAsyncThunk(
  'notes/fetchUniverseNotes',
  async (universeId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/notes/universe/${universeId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// Fetch all notes for a scene
export const fetchSceneNotes = createAsyncThunk(
  'notes/fetchSceneNotes',
  async (sceneId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/notes/scene/${sceneId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// Fetch all notes for a character
export const fetchCharacterNotes = createAsyncThunk(
  'notes/fetchCharacterNotes',
  async (characterId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/notes/character/${characterId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// Fetch a single note
export const fetchNote = createAsyncThunk(
  'notes/fetchNote',
  async (noteId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/notes/${noteId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// Create a new note
export const createNote = createAsyncThunk(
  'notes/createNote',
  async (noteData, { rejectWithValue }) => {
    try {
      const response = await apiClient.createNote(noteData);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// Update a note
export const updateNote = createAsyncThunk(
  'notes/updateNote',
  async ({ noteId, noteData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.updateNote(noteId, noteData);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// Delete a note
export const deleteNote = createAsyncThunk(
  'notes/deleteNote',
  async (noteId, { rejectWithValue }) => {
    try {
      await apiClient.deleteNote(noteId);
      return noteId;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// Archive a note
export const archiveNote = createAsyncThunk(
  'notes/archiveNote',
  async (noteId, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(API_MODAL_ROUTES.ARCHIVE_NOTE.replace(':id', noteId));
      return response.data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// Unarchive a note
export const unarchiveNote = createAsyncThunk(
  'notes/unarchiveNote',
  async (noteId, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(API_MODAL_ROUTES.UNARCHIVE_NOTE.replace(':id', noteId));
      return response.data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);
