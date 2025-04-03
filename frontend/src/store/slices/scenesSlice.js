import { createSlice } from "@reduxjs/toolkit";
import {
  fetchScenes,
  createScene,
  updateScene,
  deleteScene,
  fetchSceneById,
  reorderScenes,
  fetchScenesForUniverse,
} from "../thunks/scenesThunks";

const initialState = {
  scenes: [],
  currentScene: null,
  loading: false,
  error: null,
  success: false,
  universeScenes: {}, // Stores scenes by universeId
  message: "",
  locallyCreatedScenes: [], // Add support for locally created scenes
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
    addLocallyCreatedScene(state, action) {
      // Add a scene to locallyCreatedScenes if it doesn't exist already
      const exists = state.locallyCreatedScenes.some(scene => scene.id === action.payload.id);
      if (!exists) {
        state.locallyCreatedScenes.push(action.payload);

        // Also add to the main scenes array if not already there
        const mainExists = state.scenes.some(scene => scene.id === action.payload.id);
        if (!mainExists) {
          state.scenes.push(action.payload);
        }
      }
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

        // Extract universeId from the action meta arg
        const universeId = action.meta?.arg;

        // Use scenes array directly from serialized response
        if (action.payload && action.payload.scenes) {
          // Create a map to efficiently check for duplicates
          const scenesMap = new Map();

          // Add API scenes to the map first
          action.payload.scenes.forEach(scene => {
            scenesMap.set(scene.id, scene);
          });

          // Add locally created scenes that aren't already in the API results
          // but only if they belong to this universe
          state.locallyCreatedScenes.forEach(scene => {
            if (!scenesMap.has(scene.id) && scene.universe_id === universeId) {
              scenesMap.set(scene.id, scene);
            }
          });

          // Update scenes array with all unique scenes
          const universeScenes = Array.from(scenesMap.values());

          // Store scenes specifically for this universe
          if (universeId) {
            state.universeScenes[universeId] = universeScenes;
          }

          // For backward compatibility, also update the main scenes array
          state.scenes = universeScenes;
        } else {
          // If no scenes were returned, still keep locally created scenes for this universe
          const universeLocalScenes = state.locallyCreatedScenes.filter(
            scene => scene.universe_id === universeId
          );

          // Store scenes specifically for this universe
          if (universeId) {
            state.universeScenes[universeId] = universeLocalScenes;
          }

          // For backward compatibility, also update the main scenes array
          state.scenes = universeLocalScenes;
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
          const newScene = action.payload.scene;
          // Check if the scene already exists to avoid duplicates
          const exists = state.scenes.some(scene => scene.id === newScene.id);
          if (!exists) {
            state.scenes.push(newScene);
          }

          // Also add to locally created scenes for persistence
          const localExists = state.locallyCreatedScenes.some(scene => scene.id === newScene.id);
          if (!localExists) {
            state.locallyCreatedScenes.push(newScene);
          }
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

          // Also remove from locally created scenes
          state.locallyCreatedScenes = state.locallyCreatedScenes.filter(
            (scene) => scene.id !== sceneId
          );

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
      })

      // fetchScenesForUniverse
      .addCase(fetchScenesForUniverse.fulfilled, (state, action) => {
        console.log("Reducer - fetchScenesForUniverse.fulfilled with payload:", action.payload);

        state.loading = false;
        state.error = action.payload.error || null;

        // Ensure we have a valid scenes array
        if (Array.isArray(action.payload.scenes)) {
          state.scenes = action.payload.scenes;
        } else if (action.payload.scenes === null || action.payload.scenes === undefined) {
          // If no scenes array was provided, keep the current array or use empty array
          console.warn("Reducer - No scenes array in payload, using empty array");
          state.scenes = [];
        }

        // Set message from payload or default
        state.message = action.payload.message || "Scenes loaded";
      })

      // Handle failed fetch of scenes
      .addCase(fetchScenesForUniverse.rejected, (state, action) => {
        console.error("Reducer - fetchScenesForUniverse.rejected with error:", action.error, "payload:", action.payload);

        state.loading = false;
        state.error = action.payload?.message || action.error.message || "Failed to fetch scenes";

        // Don't clear the scenes array on error - keep any existing data
        if (action.payload?.scenes) {
          state.scenes = action.payload.scenes;
        }

        state.message = "Error loading scenes";
      });
  },
});

export const { clearSceneError, clearSceneSuccess, resetSceneState, addLocallyCreatedScene } =
  scenesSlice.actions;

export default scenesSlice.reducer;
