import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  scenes: [],
  currentScene: null,
  loading: false,
  error: null,
};

const sceneSlice = createSlice({
  name: 'scene',
  initialState,
  reducers: {
    setScenes: (state, action) => {
      state.scenes = action.payload;
      state.error = null;
    },
    setCurrentScene: (state, action) => {
      state.currentScene = action.payload;
      state.error = null;
    },
    addScene: (state, action) => {
      state.scenes.push(action.payload);
      state.error = null;
    },
    updateScene: (state, action) => {
      const index = state.scenes.findIndex(scene => scene.id === action.payload.id);
      if (index !== -1) {
        state.scenes[index] = action.payload;
      }
      if (state.currentScene?.id === action.payload.id) {
        state.currentScene = action.payload;
      }
      state.error = null;
    },
    deleteScene: (state, action) => {
      state.scenes = state.scenes.filter(scene => scene.id !== action.payload);
      if (state.currentScene?.id === action.payload) {
        state.currentScene = null;
      }
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setScenes,
  setCurrentScene,
  addScene,
  updateScene,
  deleteScene,
  setLoading,
  setError,
  clearError,
} = sceneSlice.actions;

export default sceneSlice.reducer; 