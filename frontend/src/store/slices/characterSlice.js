import { createSlice } from '@reduxjs/toolkit';
import {
  fetchCharacters,
  fetchCharactersByUniverse,
  fetchCharacter,
  createCharacter,
  updateCharacter,
  deleteCharacter
} from '../thunks/characterThunks';

const initialState = {
  characters: [],
  currentCharacter: null,
  loading: false,
  error: null,
  success: false,
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
    updateCharacterAction: (state, action) => {
      const index = state.characters.findIndex(char => char.id === action.payload.id);
      if (index !== -1) {
        state.characters[index] = action.payload;
      }
      if (state.currentCharacter?.id === action.payload.id) {
        state.currentCharacter = action.payload;
      }
      state.error = null;
    },
    deleteCharacterAction: (state, action) => {
      state.characters = state.characters.filter(char => char.id !== action.payload);
      if (state.currentCharacter?.id === action.payload) {
        state.currentCharacter = null;
      }
      state.error = null;
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
    clearSuccess: (state) => {
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    // fetchCharacters
    builder
      .addCase(fetchCharacters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCharacters.fulfilled, (state, action) => {
        state.loading = false;
        state.characters = action.payload;
      })
      .addCase(fetchCharacters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch characters";
      })

      // fetchCharactersByUniverse
      .addCase(fetchCharactersByUniverse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCharactersByUniverse.fulfilled, (state, action) => {
        state.loading = false;
        state.characters = action.payload;
      })
      .addCase(fetchCharactersByUniverse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch characters";
      })

      // fetchCharacter
      .addCase(fetchCharacter.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCharacter.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCharacter = action.payload;
      })
      .addCase(fetchCharacter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch character";
      })

      // createCharacter
      .addCase(createCharacter.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createCharacter.fulfilled, (state, action) => {
        state.loading = false;
        state.characters.push(action.payload);
        state.success = true;
      })
      .addCase(createCharacter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to create character";
        state.success = false;
      })

      // updateCharacter
      .addCase(updateCharacter.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateCharacter.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.characters.findIndex(char => char.id === action.payload.id);
        if (index !== -1) {
          state.characters[index] = action.payload;
        }
        if (state.currentCharacter?.id === action.payload.id) {
          state.currentCharacter = action.payload;
        }
        state.success = true;
      })
      .addCase(updateCharacter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to update character";
        state.success = false;
      })

      // deleteCharacter
      .addCase(deleteCharacter.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteCharacter.fulfilled, (state, action) => {
        state.loading = false;
        state.characters = state.characters.filter(char => char.id !== action.payload);
        if (state.currentCharacter?.id === action.payload) {
          state.currentCharacter = null;
        }
        state.success = true;
      })
      .addCase(deleteCharacter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to delete character";
        state.success = false;
      });
  }
});

export const {
  setCharacters,
  setCurrentCharacter,
  addCharacter,
  updateCharacterAction,
  deleteCharacterAction,
  openModal,
  closeModal,
  clearError,
  clearSuccess,
} = characterSlice.actions;

export default characterSlice.reducer; 