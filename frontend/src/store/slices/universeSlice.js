import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  universes: [],
  currentUniverse: null,
  loading: false,
  error: null,
};

const universeSlice = createSlice({
  name: 'universe',
  initialState,
  reducers: {
    fetchUniversesStart: state => {
      state.loading = true;
      state.error = null;
    },
    fetchUniversesSuccess: (state, action) => {
      state.universes = action.payload;
      state.loading = false;
    },
    fetchUniversesFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setCurrentUniverse: (state, action) => {
      state.currentUniverse = action.payload;
    },
    updateUniverse: (state, action) => {
      const index = state.universes.findIndex(u => u.id === action.payload.id);
      if (index !== -1) {
        state.universes[index] = action.payload;
        if (state.currentUniverse?.id === action.payload.id) {
          state.currentUniverse = action.payload;
        }
      }
    },
    deleteUniverse: (state, action) => {
      state.universes = state.universes.filter(u => u.id !== action.payload);
      if (state.currentUniverse?.id === action.payload) {
        state.currentUniverse = null;
      }
    },
  },
});

export const {
  fetchUniversesStart,
  fetchUniversesSuccess,
  fetchUniversesFailure,
  setCurrentUniverse,
  updateUniverse,
  deleteUniverse,
} = universeSlice.actions;

export default universeSlice.reducer;
