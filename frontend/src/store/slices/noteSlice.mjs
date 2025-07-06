import { createSlice } from '@reduxjs/toolkit';
import {
  archiveNote,
  createNote,
  deleteNote,
  fetchCharacterNotes,
  fetchNote,
  fetchSceneNotes,
  fetchUniverseNotes,
  unarchiveNote,
  updateNote,
} from '../thunks/noteThunks.mjs';

const initialState = {
  notes: [],
  currentNote: null,
  selectedNote: null,
  loading: false,
  error: null,
  success: false,
  modalOpen: false,
  modalType: null,
};

const noteSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    setNotes: (state, action) => {
      state.notes = action.payload;
      state.error = null;
    },
    setCurrentNote: (state, action) => {
      state.currentNote = action.payload;
      state.error = null;
    },
    addNoteAction: (state, action) => {
      state.notes.push(action.payload);
    },
    updateNoteAction: (state, action) => {
      const index = state.notes.findIndex((note) => note.id === action.payload.id);
      if (index !== -1) {
        state.notes[index] = action.payload;
        if (state.currentNote?.id === action.payload.id) {
          state.currentNote = action.payload;
        }
        if (state.selectedNote?.id === action.payload.id) {
          state.selectedNote = action.payload;
        }
      }
    },
    deleteNoteAction: (state, action) => {
      state.notes = state.notes.filter((note) => note.id !== action.payload);
      if (state.currentNote?.id === action.payload) {
        state.currentNote = null;
      }
      if (state.selectedNote?.id === action.payload) {
        state.selectedNote = null;
      }
    },
    openModal: (state, action) => {
      state.modalOpen = true;
      if (typeof action.payload === 'object' && action.payload !== null) {
        // If we're passing an object with type and note
        state.modalType = action.payload.type;
        state.selectedNote = action.payload.note;
      } else {
        // If we're just passing the type
        state.modalType = action.payload;
        state.selectedNote = null;
      }
    },
    closeModal: (state) => {
      state.modalOpen = false;
      state.modalType = null;
      state.selectedNote = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    // Fetch universe notes
    builder
      .addCase(fetchUniverseNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUniverseNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = action.payload;
      })
      .addCase(fetchUniverseNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch universe notes';
      })

      // Fetch scene notes
      .addCase(fetchSceneNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSceneNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = action.payload;
      })
      .addCase(fetchSceneNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch scene notes';
      })

      // Fetch character notes
      .addCase(fetchCharacterNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCharacterNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = action.payload;
      })
      .addCase(fetchCharacterNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch character notes';
      })

      // Fetch single note
      .addCase(fetchNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNote.fulfilled, (state, action) => {
        state.loading = false;
        state.currentNote = action.payload;
      })
      .addCase(fetchNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch note';
      })

      // Create note
      .addCase(createNote.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createNote.fulfilled, (state, action) => {
        state.loading = false;
        state.notes.push(action.payload);
        state.success = true;
        state.modalOpen = false;
      })
      .addCase(createNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to create note';
        state.success = false;
      })

      // Update note
      .addCase(updateNote.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateNote.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.notes.findIndex((note) => note.id === action.payload.id);
        if (index !== -1) {
          state.notes[index] = action.payload;
          if (state.currentNote?.id === action.payload.id) {
            state.currentNote = action.payload;
          }
          if (state.selectedNote?.id === action.payload.id) {
            state.selectedNote = action.payload;
          }
        }
        state.success = true;
        state.modalOpen = false;
      })
      .addCase(updateNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to update note';
        state.success = false;
      })

      // Delete note
      .addCase(deleteNote.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = state.notes.filter((note) => note.id !== action.payload);
        if (state.currentNote?.id === action.payload) {
          state.currentNote = null;
        }
        if (state.selectedNote?.id === action.payload) {
          state.selectedNote = null;
        }
        state.success = true;
      })
      .addCase(deleteNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to delete note';
        state.success = false;
      })

      // Archive note
      .addCase(archiveNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(archiveNote.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.notes.findIndex((note) => note.id === action.payload.id);
        if (index !== -1) {
          state.notes[index] = action.payload;
          if (state.currentNote?.id === action.payload.id) {
            state.currentNote = action.payload;
          }
          if (state.selectedNote?.id === action.payload.id) {
            state.selectedNote = action.payload;
          }
        }
        state.success = true;
      })
      .addCase(archiveNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to archive note';
      })

      // Unarchive note
      .addCase(unarchiveNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unarchiveNote.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.notes.findIndex((note) => note.id === action.payload.id);
        if (index !== -1) {
          state.notes[index] = action.payload;
          if (state.currentNote?.id === action.payload.id) {
            state.currentNote = action.payload;
          }
          if (state.selectedNote?.id === action.payload.id) {
            state.selectedNote = action.payload;
          }
        }
        state.success = true;
      })
      .addCase(unarchiveNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to unarchive note';
      });
  },
});

export const {
  setNotes,
  setCurrentNote,
  addNoteAction,
  updateNoteAction,
  deleteNoteAction,
  openModal,
  closeModal,
  clearError,
  clearSuccess,
} = noteSlice.actions;

export default noteSlice.reducer;
