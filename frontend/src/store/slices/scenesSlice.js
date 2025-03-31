import { createSlice } from "@reduxjs/toolkit";
import {
  fetchScenes,
  createScene,
  updateScene,
  deleteScene,
  fetchSceneById,
  reorderScenes,
} from "../thunks/scenesThunks";

const initialState = {
  scenes: [],
  currentScene: null,
  loading: false,
  error: null,
  success: false,
  universeScenes: {}, // Stores scenes by universeId
};

const scenesSlice = createSlice({
  name: "scenes",
  initialState,
  reducers: {
    clearSceneError(state) {
      state.error = null;
    },
    clearSceneSuccess(state) {
      state.success = false;
    },
    resetSceneState(state) {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchScenes
      .addCase(fetchScenes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchScenes.fulfilled, (state, action) => {
        state.loading = false;

        // Use scenes array directly from serialized response
        if (action.payload && action.payload.scenes) {
          state.scenes = action.payload.scenes;
        }
      })
      .addCase(fetchScenes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch scenes";
      })

      // fetchSceneById
      .addCase(fetchSceneById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSceneById.fulfilled, (state, action) => {
        state.loading = false;
        // Set current scene from serialized response
        if (action.payload && action.payload.scene) {
          state.currentScene = action.payload.scene;
        }
      })
      .addCase(fetchSceneById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch scene";
      })

      // createScene
      .addCase(createScene.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createScene.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        // Add the new scene to the scenes array if it exists
        if (action.payload && action.payload.scene) {
          state.scenes.push(action.payload.scene);
        }
      })
      .addCase(createScene.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create scene";
        state.success = false;
      })

      // updateScene
      .addCase(updateScene.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateScene.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        // Update the scene in the scenes array
        if (action.payload && action.payload.scene) {
          const updatedScene = action.payload.scene;
          const index = state.scenes.findIndex((scene) => scene.id === updatedScene.id);
          if (index !== -1) {
            state.scenes[index] = updatedScene;
          }

          // Update currentScene if it's the same one
          if (state.currentScene && state.currentScene.id === updatedScene.id) {
            state.currentScene = updatedScene;
          }
        }
      })
      .addCase(updateScene.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update scene";
        state.success = false;
      })

      // deleteScene
      .addCase(deleteScene.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteScene.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        // Remove the deleted scene from the scenes array
        if (action.payload && action.payload.id) {
          const sceneId = action.payload.id;
          state.scenes = state.scenes.filter((scene) => scene.id !== sceneId);

          // Clear currentScene if it's the deleted one
          if (state.currentScene && state.currentScene.id === sceneId) {
            state.currentScene = null;
          }
        }
      })
      .addCase(deleteScene.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to delete scene";
        state.success = false;
      })

      // reorderScenes
      .addCase(reorderScenes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reorderScenes.fulfilled, (state, action) => {
        state.loading = false;
        const { universeId } = action.meta.arg;
        const reorderedScenes = action.payload.scenes;

        // Update the scenes in the universeScenes object
        state.universeScenes[universeId] = reorderedScenes;

        // Update the general scenes array
        state.scenes = state.scenes.map((scene) => {
          if (scene.universe_id === universeId) {
            const updatedScene = reorderedScenes.find((s) => s.id === scene.id);
            return updatedScene || scene;
          }
          return scene;
        });

        // Update current scene if it's in the reordered universe
        if (
          state.currentScene &&
          state.currentScene.universe_id === universeId
        ) {
          const updatedCurrentScene = reorderedScenes.find(
            (s) => s.id === state.currentScene.id
          );
          if (updatedCurrentScene) {
            state.currentScene = updatedCurrentScene;
          }
        }
      })
      .addCase(reorderScenes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to reorder scenes";
      });
  },
});

export const { clearSceneError, clearSceneSuccess, resetSceneState } =
  scenesSlice.actions;

export default scenesSlice.reducer;
