import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  universes: null,
  loading: false,
  error: null,
  currentUniverse: null,
};

const universeSlice = createSlice({
  name: 'universe',
  initialState,
  reducers: {
    // Fetch universes
    fetchUniversesStart: state => {
      state.loading = true;
      state.error = null;
    },
    fetchUniversesSuccess: (state, action) => {
      state.loading = false;
      state.universes = action.payload;
      state.error = null;
    },
    fetchUniversesFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Create universe
    createUniverseStart: state => {
      state.loading = true;
      state.error = null;
    },
    createUniverseSuccess: (state, action) => {
      state.loading = false;
      state.universes = state.universes
        ? [...state.universes, action.payload]
        : [action.payload];
      state.currentUniverse = action.payload;
      state.error = null;
    },
    createUniverseFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Update universe
    updateUniverseStart: state => {
      state.loading = true;
      state.error = null;
    },
    updateUniverseSuccess: (state, action) => {
      state.loading = false;
      state.universes = state.universes.map(universe =>
        universe.id === action.payload.id ? action.payload : universe
      );
      state.currentUniverse = action.payload;
      state.error = null;
    },
    updateUniverseFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Delete universe
    deleteUniverseStart: state => {
      state.loading = true;
      state.error = null;
    },
    deleteUniverseSuccess: (state, action) => {
      state.loading = false;
      state.universes = state.universes.filter(
        universe => universe.id !== action.payload
      );
      state.currentUniverse = null;
      state.error = null;
    },
    deleteUniverseFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Set current universe
    setCurrentUniverse: (state, action) => {
      state.currentUniverse = action.payload;
    },

    // Clear errors
    clearError: state => {
      state.error = null;
    },

    // Reset state
    resetState: () => initialState,
  },
});

export const {
  fetchUniversesStart,
  fetchUniversesSuccess,
  fetchUniversesFailure,
  createUniverseStart,
  createUniverseSuccess,
  createUniverseFailure,
  updateUniverseStart,
  updateUniverseSuccess,
  updateUniverseFailure,
  deleteUniverseStart,
  deleteUniverseSuccess,
  deleteUniverseFailure,
  setCurrentUniverse,
  clearError,
  resetState,
} = universeSlice.actions;

export default universeSlice.reducer;
