import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  characters: [],
  currentCharacter: null,
  loading: false,
  error: null,
  modalOpen: false,
  modalType: null, // 'create', 'edit', 'view', 'delete'
};

const characterSlice = createSlice({
  name: 'characters',
  initialState,
  reducers: {
    setCharacters: (state, action) => {
      state.characters = action.payload;
      state.error = null;
    },
    setCurrentCharacter: (state, action) => {
      state.currentCharacter = action.payload;
      state.error = null;
    },
    addCharacter: (state, action) => {
      state.characters.push(action.payload);
      state.error = null;
    },
    updateCharacter: (state, action) => {
      const index = state.characters.findIndex(char => char.id === action.payload.id);
      if (index !== -1) {
        state.characters[index] = action.payload;
      }
      if (state.currentCharacter?.id === action.payload.id) {
        state.currentCharacter = action.payload;
      }
      state.error = null;
    },
    deleteCharacter: (state, action) => {
      state.characters = state.characters.filter(char => char.id !== action.payload);
      if (state.currentCharacter?.id === action.payload) {
        state.currentCharacter = null;
      }
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
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
  setCharacters,
  setCurrentCharacter,
  addCharacter,
  updateCharacter,
  deleteCharacter,
  setLoading,
  setError,
  openModal,
  closeModal,
  clearError,
} = characterSlice.actions;

export default characterSlice.reducer; 