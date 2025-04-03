import { createSlice } from "@reduxjs/toolkit";
import {
  fetchScenes,
  createScene,
  updateScene,
  deleteScene,
  fetchSceneById,
  reorderScenes,
  fetchScenesForUniverse,
} from "../thunks/consolidated/scenesThunks";

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
    setError(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
    setCurrentScene(state, action) {
      state.currentScene = action.payload;
    },
    addScene(state, action) {
      // Add a scene if it doesn't already exist
      const exists = state.scenes.some(scene => scene.id === action.payload.id);
      if (!exists) {
        state.scenes.push(action.payload);
      }
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
        console.log("DEBUG STORE: fetchScenes.fulfilled with payload:", action.payload);
        console.log("DEBUG STORE: universeId from action meta:", action.meta?.arg);

        // Extract universeId from the action meta arg
        const universeId = action.meta?.arg;
        console.log("DEBUG STORE: Processing scenes for universeId:", universeId);

        // Use scenes array directly from serialized response
        if (action.payload && action.payload.scenes) {
          console.log("DEBUG STORE: Found scenes in payload:", action.payload.scenes.length);
          // Create a map to efficiently check for duplicates
          const scenesMap = new Map();

          // First add any existing scenes for this universe from universeScenes
          if (state.universeScenes[universeId]) {
            console.log("DEBUG STORE: Adding existing universe scenes from state:", state.universeScenes[universeId].length);
            state.universeScenes[universeId].forEach(scene => {
              if (scene && scene.id) {
                scenesMap.set(scene.id, scene);
              }
            });
          } else {
            console.log("DEBUG STORE: No existing scenes found for this universe in state");
          }

          // Add API scenes to the map second (so they override existing ones)
          console.log("DEBUG STORE: Adding scenes from API response");
          action.payload.scenes.forEach(scene => {
            if (scene && scene.id) {
              scenesMap.set(scene.id, scene);
            } else {
              console.warn("DEBUG STORE: Encountered scene without ID in API response:", scene);
            }
          });

          // Add locally created scenes that aren't already in the API results
          // but only if they belong to this universe
          if (state.locallyCreatedScenes.length > 0) {
            console.log("DEBUG STORE: Adding locally created scenes:", state.locallyCreatedScenes.length);
            state.locallyCreatedScenes.forEach(scene => {
              if (scene && scene.id && !scenesMap.has(scene.id) && scene.universe_id === universeId) {
                scenesMap.set(scene.id, scene);
              }
            });
          }

          // Update scenes array with all unique scenes
          const universeScenes = Array.from(scenesMap.values());
          console.log("DEBUG STORE: Final scenes count after processing:", universeScenes.length);

          // Store scenes specifically for this universe
          if (universeId) {
            state.universeScenes[universeId] = universeScenes;
            console.log("DEBUG STORE: Stored scenes for universe in state.universeScenes");
          }

          // For backward compatibility, also update the main scenes array
          state.scenes = universeScenes;
          console.log("DEBUG STORE: Updated main scenes array in state");
        } else {
          console.log("DEBUG STORE: No scenes found in action.payload, checking for local scenes");
          // If no scenes were returned, still keep locally created scenes for this universe
          // and any existing scenes we may already have
          const existingUniverseScenes = state.universeScenes[universeId] || [];
          const universeLocalScenes = state.locallyCreatedScenes.filter(
            scene => scene && scene.universe_id === universeId
          );

          // Combine existing and local scenes, removing duplicates
          const scenesMap = new Map();

          // Add existing scenes first
          existingUniverseScenes.forEach(scene => {
            if (scene && scene.id) {
              scenesMap.set(scene.id, scene);
            }
          });

          // Add locally created scenes second
          universeLocalScenes.forEach(scene => {
            if (scene && scene.id) {
              scenesMap.set(scene.id, scene);
            }
          });

          const combinedScenes = Array.from(scenesMap.values());

          // Store scenes specifically for this universe
          if (universeId) {
            state.universeScenes[universeId] = combinedScenes;
          }

          // For backward compatibility, also update the main scenes array
          state.scenes = combinedScenes;
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

          // Get the universe ID of the scene before removing it
          const deletedScene = state.scenes.find(scene => scene.id === sceneId);
          const universeId = deletedScene?.universe_id;

          // Remove from main scenes array
          state.scenes = state.scenes.filter((scene) => scene.id !== sceneId);

          // Also remove from locally created scenes
          state.locallyCreatedScenes = state.locallyCreatedScenes.filter(
            (scene) => scene.id !== sceneId
          );

          // Remove from universeScenes if the universe ID is known
          if (universeId && state.universeScenes[universeId]) {
            state.universeScenes[universeId] = state.universeScenes[universeId].filter(
              (scene) => scene.id !== sceneId
            );
          } else {
            // If we don't know the universe ID, we need to check all universes
            Object.keys(state.universeScenes).forEach(universeKey => {
              state.universeScenes[universeKey] = state.universeScenes[universeKey].filter(
                (scene) => scene.id !== sceneId
              );
            });
          }

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

export const { clearSceneError, clearSceneSuccess, resetSceneState, setError, setCurrentScene, addScene, addLocallyCreatedScene } =
  scenesSlice.actions;

export default scenesSlice.reducer;
