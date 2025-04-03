import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  scenes: [],
  currentScene: null,
  loading: false,
  error: null,
  locallyCreatedScenes: [],
};

const sceneSlice = createSlice({
  name: 'scene',
  initialState,
  reducers: {
    setScenes: (state, action) => {
      const scenesMap = new Map();

      action.payload.forEach(scene => {
        scenesMap.set(scene.id, scene);
      });

      state.locallyCreatedScenes.forEach(scene => {
        if (!scenesMap.has(scene.id)) {
          scenesMap.set(scene.id, scene);
        }
      });

      state.scenes = Array.from(scenesMap.values());
      state.error = null;
    },
    setCurrentScene: (state, action) => {
      state.currentScene = action.payload;
      state.error = null;
    },
    addScene: (state, action) => {
      const exists = state.scenes.some(scene => scene.id === action.payload.id);
      if (!exists) {
        state.scenes.push(action.payload);
      }
      state.error = null;
    },
    addLocallyCreatedScene: (state, action) => {
      const exists = state.locallyCreatedScenes.some(scene => scene.id === action.payload.id);
      if (!exists) {
        state.locallyCreatedScenes.push(action.payload);

        const mainExists = state.scenes.some(scene => scene.id === action.payload.id);
        if (!mainExists) {
          state.scenes.push(action.payload);
        }
      }
    },
    updateScene: (state, action) => {
      const index = state.scenes.findIndex(scene => scene.id === action.payload.id);
      if (index !== -1) {
        state.scenes[index] = action.payload;
      }

      const localIndex = state.locallyCreatedScenes.findIndex(scene => scene.id === action.payload.id);
      if (localIndex !== -1) {
        state.locallyCreatedScenes[localIndex] = action.payload;
      }

      if (state.currentScene?.id === action.payload.id) {
        state.currentScene = action.payload;
      }
      state.error = null;
    },
    deleteScene: (state, action) => {
      state.scenes = state.scenes.filter(scene => scene.id !== action.payload);
      state.locallyCreatedScenes = state.locallyCreatedScenes.filter(
        scene => scene.id !== action.payload
      );

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
  addLocallyCreatedScene,
  updateScene,
  deleteScene,
  setLoading,
  setError,
  clearError,
} = sceneSlice.actions;

export default sceneSlice.reducer; 