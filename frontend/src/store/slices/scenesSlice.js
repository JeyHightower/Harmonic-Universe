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

        // Handle different response formats
        let scenesData = [];
        if (
          action.payload &&
          action.payload.data &&
          Array.isArray(action.payload.data.scenes)
        ) {
          // Format: { data: { scenes: [...] } }
          scenesData = action.payload.data.scenes;
        } else if (action.payload && Array.isArray(action.payload.scenes)) {
          // Format: { scenes: [...] }
          scenesData = action.payload.scenes;
        } else if (
          action.payload &&
          typeof action.payload === "object" &&
          action.payload.status === "success"
        ) {
          // Format from simple_app.py: { status: 'success', data: { scenes: [...] } }
          scenesData = action.payload.data?.scenes || [];
        } else if (Array.isArray(action.payload)) {
          // Direct array format
          scenesData = action.payload;
        } else {
          console.error("Unexpected scenes response format:", action.payload);
          scenesData = [];
        }

        state.scenes = scenesData;

        // Organize scenes by universe for easy access
        scenesData.forEach((scene) => {
          const universeId = scene.universe_id;
          if (!state.universeScenes[universeId]) {
            state.universeScenes[universeId] = [];
          }
          // Only add if not already in the array
          if (
            !state.universeScenes[universeId].some((s) => s.id === scene.id)
          ) {
            state.universeScenes[universeId].push(scene);
          }
        });
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
        state.currentScene = action.payload.scene;
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

        // Handle different possible response formats
        let newScene;
        if (action.payload && typeof action.payload === "object") {
          if (
            action.payload.status === "success" &&
            action.payload.data &&
            action.payload.data.scene
          ) {
            // Simple backend format: { status: 'success', data: { scene: {...} } }
            newScene = action.payload.data.scene;
          } else if (
            action.payload.scene &&
            typeof action.payload.scene === "object"
          ) {
            // Response format: { scene: {...} }
            newScene = action.payload.scene;
          } else if (action.payload.data && action.payload.data.scene) {
            // Response format: { data: { scene: {...} } }
            newScene = action.payload.data.scene;
          } else if (action.payload.id) {
            // Response format: The payload itself is the scene
            newScene = action.payload;
          } else {
            console.error(
              "Unexpected response format in createScene.fulfilled:",
              action.payload
            );
            newScene = null;
          }
        } else {
          console.error(
            "Invalid payload in createScene.fulfilled:",
            action.payload
          );
          newScene = null;
        }

        if (newScene) {
          // Add the new scene to the scenes array
          state.scenes.push(newScene);
          state.currentScene = newScene;

          // Also add to the universeScenes mapping
          const universeId = newScene.universe_id;
          if (!state.universeScenes[universeId]) {
            state.universeScenes[universeId] = [];
          }
          state.universeScenes[universeId].push(newScene);
        } else {
          console.error(
            "Failed to extract scene data from response:",
            action.payload
          );
        }

        state.error = null;
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
        const updatedScene = action.payload.scene;

        // Update in general scenes array
        const index = state.scenes.findIndex((s) => s.id === updatedScene.id);
        if (index !== -1) {
          state.scenes[index] = updatedScene;
        }

        // Update in universe-specific array
        const universeId = updatedScene.universe_id;
        if (state.universeScenes[universeId]) {
          const uIndex = state.universeScenes[universeId].findIndex(
            (s) => s.id === updatedScene.id
          );
          if (uIndex !== -1) {
            state.universeScenes[universeId][uIndex] = updatedScene;
          }
        }

        // Update current scene if it's the one being updated
        if (state.currentScene && state.currentScene.id === updatedScene.id) {
          state.currentScene = updatedScene;
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
        const deletedId = action.meta.arg;

        // Find the universe_id before removing from scenes array
        const deletedScene = state.scenes.find((s) => s.id === deletedId);
        const universeId = deletedScene?.universe_id;

        // Remove from general scenes array
        state.scenes = state.scenes.filter((s) => s.id !== deletedId);

        // Remove from universe-specific array
        if (universeId && state.universeScenes[universeId]) {
          state.universeScenes[universeId] = state.universeScenes[
            universeId
          ].filter((s) => s.id !== deletedId);
        }

        // Clear current scene if it's the one being deleted
        if (state.currentScene && state.currentScene.id === deletedId) {
          state.currentScene = null;
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
