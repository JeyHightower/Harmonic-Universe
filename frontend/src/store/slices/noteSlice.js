import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notes: [],
  currentNote: null,
  loading: false,
  error: null,
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
    addNote: (state, action) => {
      state.notes.push(action.payload);
    },
    updateNote: (state, action) => {
      const index = state.notes.findIndex(note => note.id === action.payload.id);
      if (index !== -1) {
        state.notes[index] = action.payload;
        if (state.currentNote?.id === action.payload.id) {
          state.currentNote = action.payload;
        }
      }
    },
    deleteNote: (state, action) => {
      state.notes = state.notes.filter(note => note.id !== action.payload);
      if (state.currentNote?.id === action.payload) {
        state.currentNote = null;
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    openModal: (state, action) => {
      state.modalOpen = true;
      state.modalType = action.payload;
    },
    closeModal: (state) => {
      state.modalOpen = false;
      state.modalType = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setNotes,
  setCurrentNote,
  addNote,
  updateNote,
  deleteNote,
  setLoading,
  setError,
  openModal,
  closeModal,
  clearError,
} = noteSlice.actions;

export default noteSlice.reducer;
