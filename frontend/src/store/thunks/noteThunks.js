import { API_MODAL_ROUTES } from "../../utils/routes";
import {
  setNotes,
  setCurrentNote,
  addNote,
  updateNote,
  deleteNote,
  setLoading,
  setError,
  openModal,
  closeModal,
} from "../slices/noteSlice";
import { api } from "../../utils/api";

// Fetch all notes for a universe
export const fetchUniverseNotes = (universeId) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await api.get(`/notes/universe/${universeId}`);
    dispatch(setNotes(response.data));
  } catch (error) {
    dispatch(setError(error.response?.data?.message || "Failed to fetch notes"));
  } finally {
    dispatch(setLoading(false));
  }
};

// Fetch all notes for a scene
export const fetchSceneNotes = (sceneId) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await api.get(`/notes/scene/${sceneId}`);
    dispatch(setNotes(response.data));
  } catch (error) {
    dispatch(setError(error.response?.data?.message || "Failed to fetch notes"));
  } finally {
    dispatch(setLoading(false));
  }
};

// Fetch all notes for a character
export const fetchCharacterNotes = (characterId) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await api.get(`/notes/character/${characterId}`);
    dispatch(setNotes(response.data));
  } catch (error) {
    dispatch(setError(error.response?.data?.message || "Failed to fetch notes"));
  } finally {
    dispatch(setLoading(false));
  }
};

// Fetch a single note
export const fetchNote = (noteId) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await api.get(`/notes/${noteId}`);
    dispatch(setCurrentNote(response.data));
  } catch (error) {
    dispatch(setError(error.response?.data?.message || "Failed to fetch note"));
  } finally {
    dispatch(setLoading(false));
  }
};

// Create a new note
export const createNote = (noteData) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await api.post(API_MODAL_ROUTES.CREATE_NOTE, noteData);
    dispatch(addNote(response.data));
    dispatch(closeModal());
    return response.data;
  } catch (error) {
    dispatch(setError(error.response?.data?.message || "Failed to create note"));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// Update a note
export const updateNoteById = (noteId, noteData) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await api.put(API_MODAL_ROUTES.EDIT_NOTE.replace(":id", noteId), noteData);
    dispatch(updateNote(response.data));
    dispatch(closeModal());
    return response.data;
  } catch (error) {
    dispatch(setError(error.response?.data?.message || "Failed to update note"));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// Delete a note
export const deleteNoteById = (noteId) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    await api.delete(API_MODAL_ROUTES.DELETE_NOTE.replace(":id", noteId));
    dispatch(deleteNote(noteId));
  } catch (error) {
    dispatch(setError(error.response?.data?.message || "Failed to delete note"));
  } finally {
    dispatch(setLoading(false));
  }
};

// Archive a note
export const archiveNote = (noteId) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await api.post(API_MODAL_ROUTES.ARCHIVE_NOTE.replace(":id", noteId));
    dispatch(updateNote(response.data));
    return response.data;
  } catch (error) {
    dispatch(setError(error.response?.data?.message || "Failed to archive note"));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// Unarchive a note
export const unarchiveNote = (noteId) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await api.post(API_MODAL_ROUTES.UNARCHIVE_NOTE.replace(":id", noteId));
    dispatch(updateNote(response.data));
    return response.data;
  } catch (error) {
    dispatch(setError(error.response?.data?.message || "Failed to unarchive note"));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
}; 