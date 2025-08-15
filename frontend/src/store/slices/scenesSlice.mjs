import { createSlice } from '@reduxjs/toolkit';
import {
  createSceneAndRefresh,
  deleteSceneAndRefresh,
  fetchSceneById,
  fetchScenes,
  reorderScenes,
  updateSceneAndRefresh,
} from '../thunks/scenesThunks';

const initialState = {
  scenes: [],
  currentScene: null,
  loading: false,
  error: null,
  success: false,
  universeScenes: {}, // Stores scenes by universeId
  message: '',
  locallyCreatedScenes: [], // Add support for locally created scenes
  lastCreateAttempt: 0, // Track timestamp of last create attempt to prevent duplicates
  selectedScenes: [],
  filterType: 'all',
  sortBy: 'name',
  sortDirection: 'asc',
};

const scenesSlice = createSlice({
  name: 'scenes',
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
      const scene = action.payload;

      // Only add if it doesn't already exist in the list
      if (!state.scenes.some((s) => s.id === scene.id)) {
        state.scenes.push(scene);
      }

      // Also add to the universe scenes if needed
      if (scene.universe_id && state.universeScenes[scene.universe_id]) {
        // Check if it's already in the universe scenes
        if (!state.universeScenes[scene.universe_id].some((s) => s.id === scene.id)) {
          state.universeScenes[scene.universe_id].push(scene);
        }
      }
    },
    addLocallyCreatedScene(state, action) {
      // Add a scene to locallyCreatedScenes if it doesn't exist already
      const exists = state.locallyCreatedScenes.some((scene) => scene.id === action.payload.id);
      if (!exists) {
        // Ensure is_deleted is explicitly set to false
        const newScene = { ...action.payload, is_deleted: false };
        state.locallyCreatedScenes.push(newScene);

        // Also add to the main scenes array if not already there
        const mainExists = state.scenes.some((scene) => scene.id === action.payload.id);
        if (!mainExists) {
          state.scenes.push(newScene);
        }

        // Add to universeScenes if not already there
        if (newScene.universe_id) {
          if (!state.universeScenes[newScene.universe_id]) {
            state.universeScenes[newScene.universe_id] = [];
          }
          const existsInUniverse = state.universeScenes[newScene.universe_id].some(
            (scene) => scene.id === newScene.id
          );
          if (!existsInUniverse) {
            state.universeScenes[newScene.universe_id].push(newScene);
          }
        }
      }
    },
    updateCreateAttempt(state, action) {
      // Update the timestamp of the last create attempt
      state.lastCreateAttempt = action.payload;
    },
    selectScene(state, action) {
      state.selectedScenes.push(action.payload);
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
        console.log('DEBUG STORE: fetchScenes.fulfilled with payload:', action.payload);
        console.log('DEBUG STORE: universeId from action meta:', action.meta?.arg);

        // Extract universeId from the action meta arg
        const universeId = action.meta?.arg;
        console.log('DEBUG STORE: Processing scenes for universeId:', universeId);

        // Use scenes array directly from serialized response
        if (action.payload && action.payload.scenes) {
          console.log('DEBUG STORE: Found scenes in payload:', action.payload.scenes.length);
          // Create a map to efficiently check for duplicates
          const scenesMap = new Map();

          // First add any existing scenes for this universe from universeScenes
          if (state.universeScenes[universeId]) {
            console.log(
              'DEBUG STORE: Adding existing universe scenes from state:',
              state.universeScenes[universeId].length
            );
            state.universeScenes[universeId].forEach((scene) => {
              if (scene && scene.id) {
                scenesMap.set(scene.id, scene);
              }
            });
          } else {
            console.log('DEBUG STORE: No existing scenes found for this universe in state');
          }

          // Filter out scenes with is_deleted=true before adding to map
          const activeScenes = action.payload.scenes.filter(
            (scene) => scene && scene.is_deleted !== true
          );
          console.log('DEBUG STORE: Filtered out deleted scenes, keeping:', activeScenes.length);

          // Add API scenes to the map second (so they override existing ones)
          console.log('DEBUG STORE: Adding scenes from API response');
          activeScenes.forEach((scene) => {
            if (scene && scene.id) {
              // Ensure is_deleted is explicitly false
              scenesMap.set(scene.id, { ...scene, is_deleted: false });
            } else {
              console.warn('DEBUG STORE: Encountered scene without ID in API response:', scene);
            }
          });

          // Add locally created scenes that aren't already in the API results
          // but only if they belong to this universe
          if (state.locallyCreatedScenes.length > 0) {
            console.log(
              'DEBUG STORE: Adding locally created scenes:',
              state.locallyCreatedScenes.length
            );
            state.locallyCreatedScenes.forEach((scene) => {
              if (
                scene &&
                scene.id &&
                !scenesMap.has(scene.id) &&
                scene.universe_id === universeId
              ) {
                // Ensure is_deleted is explicitly false
                scenesMap.set(scene.id, { ...scene, is_deleted: false });
              }
            });
          }

          // Update scenes array with all unique scenes
          const universeScenes = Array.from(scenesMap.values());
          console.log('DEBUG STORE: Final scenes count after processing:', universeScenes.length);

          // Store scenes specifically for this universe
          if (universeId) {
            state.universeScenes[universeId] = universeScenes;
            console.log('DEBUG STORE: Stored scenes for universe in state.universeScenes');
          }

          // For backward compatibility, also update the main scenes array
          // Merge in scenes to avoid overwriting scenes from other universes
          const scenesById = new Map();

          // First add existing scenes
          state.scenes.forEach((scene) => {
            if (scene && scene.id) {
              scenesById.set(scene.id, scene);
            }
          });

          // Then add/update with universe scenes
          universeScenes.forEach((scene) => {
            if (scene && scene.id) {
              scenesById.set(scene.id, scene);
            }
          });

          state.scenes = Array.from(scenesById.values());
          console.log('DEBUG STORE: Updated main scenes array in state');
        } else {
          console.log('DEBUG STORE: No scenes found in action.payload, checking for local scenes');
          // If no scenes were returned, still keep locally created scenes for this universe
          // and any existing scenes we may already have
          const existingUniverseScenes = state.universeScenes[universeId] || [];
          const universeLocalScenes = state.locallyCreatedScenes.filter(
            (scene) => scene && scene.universe_id === universeId
          );

          // Combine existing and local scenes, removing duplicates
          const scenesMap = new Map();

          // Add existing scenes first
          existingUniverseScenes.forEach((scene) => {
            if (scene && scene.id) {
              // Ensure is_deleted is explicitly false
              scenesMap.set(scene.id, { ...scene, is_deleted: false });
            }
          });

          // Add locally created scenes second
          universeLocalScenes.forEach((scene) => {
            if (scene && scene.id) {
              // Ensure is_deleted is explicitly false
              scenesMap.set(scene.id, { ...scene, is_deleted: false });
            }
          });

          const combinedScenes = Array.from(scenesMap.values());

          // Store scenes specifically for this universe
          if (universeId) {
            state.universeScenes[universeId] = combinedScenes;
          }

          // DO NOT replace all scenes - just update the ones for this universe
          const scenesById = new Map();

          // First add existing scenes
          state.scenes.forEach((scene) => {
            if (scene && scene.id) {
              scenesById.set(scene.id, scene);
            }
          });

          // Then add/update with universe scenes
          combinedScenes.forEach((scene) => {
            if (scene && scene.id) {
              scenesById.set(scene.id, scene);
            }
          });

          state.scenes = Array.from(scenesById.values());
        }
      })
      .addCase(fetchScenes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch scenes';
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
          // Ensure is_deleted is explicitly false
          state.currentScene = { ...action.payload.scene, is_deleted: false };
        }
      })
      .addCase(fetchSceneById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch scene';
      })

      // createScene
      .addCase(createSceneAndRefresh.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createSceneAndRefresh.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        // Add the new scene to the scenes array if it exists
        if (action.payload && action.payload.scene) {
          const newScene = {
            ...action.payload.scene,
            is_deleted: false, // Ensure is_deleted is explicitly false
          };

          // Check if the scene already exists to avoid duplicates
          const exists = state.scenes.some((scene) => scene.id === newScene.id);
          if (!exists) {
            state.scenes.push(newScene);
            console.log('Redux store: Added new scene to scenes array:', newScene.id);
          }

          // Also add to locally created scenes for persistence
          const localExists = state.locallyCreatedScenes.some((scene) => scene.id === newScene.id);
          if (!localExists) {
            state.locallyCreatedScenes.push(newScene);
            console.log('Redux store: Added new scene to locallyCreatedScenes:', newScene.id);
          }

          // If the scene belongs to a specific universe, update that universe's scenes
          if (newScene.universe_id) {
            // Initialize the universe's scenes array if it doesn't exist
            if (!state.universeScenes[newScene.universe_id]) {
              state.universeScenes[newScene.universe_id] = [];
            }

            // Add to universe-specific scenes if not already there
            const existsInUniverse = state.universeScenes[newScene.universe_id].some(
              (scene) => scene.id === newScene.id
            );

            if (!existsInUniverse) {
              state.universeScenes[newScene.universe_id].push(newScene);
              console.log(
                `Redux store: Added new scene to universe ${newScene.universe_id} scenes`
              );
            }
          }

          // Set as current scene for convenience
          state.currentScene = newScene;
        }
      })
      .addCase(createSceneAndRefresh.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create scene';
        state.success = false;
      })

      // updateScene
      .addCase(updateSceneAndRefresh.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateSceneAndRefresh.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        // Update the scene in the scenes array
        if (action.payload && action.payload.scene) {
          // Ensure is_deleted is explicitly false
          const updatedScene = { ...action.payload.scene, is_deleted: false };

          // Update in main scenes array
          const index = state.scenes.findIndex((scene) => scene.id === updatedScene.id);
          if (index !== -1) {
            state.scenes[index] = updatedScene;
          }

          // Update in universeScenes
          if (updatedScene.universe_id && state.universeScenes[updatedScene.universe_id]) {
            const universeIndex = state.universeScenes[updatedScene.universe_id].findIndex(
              (scene) => scene.id === updatedScene.id
            );
            if (universeIndex !== -1) {
              state.universeScenes[updatedScene.universe_id][universeIndex] = updatedScene;
            } else {
              // Add if not found
              state.universeScenes[updatedScene.universe_id].push(updatedScene);
            }
          }

          // Update in locallyCreatedScenes
          const localIndex = state.locallyCreatedScenes.findIndex(
            (scene) => scene.id === updatedScene.id
          );
          if (localIndex !== -1) {
            state.locallyCreatedScenes[localIndex] = updatedScene;
          }

          // Update currentScene if it's the same one
          if (state.currentScene && state.currentScene.id === updatedScene.id) {
            state.currentScene = updatedScene;
          }
        }
      })
      .addCase(updateSceneAndRefresh.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update scene';
        state.success = false;
      })

      // deleteScene
      .addCase(deleteSceneAndRefresh.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteSceneAndRefresh.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        // Remove the deleted scene from the scenes array
        if (action.payload && action.payload.id) {
          const sceneId = action.payload.id;

          // Get the universe ID of the scene before removing it
          const deletedScene = state.scenes.find((scene) => scene.id === sceneId);
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
            Object.keys(state.universeScenes).forEach((universeKey) => {
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
      .addCase(deleteSceneAndRefresh.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete scene';
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

        // Ensure all scenes have is_deleted: false
        const normalizedScenes = reorderedScenes.map((scene) => ({
          ...scene,
          is_deleted: false,
        }));

        // Update the scenes in the universeScenes object
        state.universeScenes[universeId] = normalizedScenes;

        // Update the general scenes array - only for scenes in this universe
        state.scenes = state.scenes.map((scene) => {
          if (scene.universe_id === universeId) {
            const updatedScene = normalizedScenes.find((s) => s.id === scene.id);
            return updatedScene || scene;
          }
          return scene;
        });

        // Update current scene if it's in the reordered universe
        if (state.currentScene && state.currentScene.universe_id === universeId) {
          const updatedCurrentScene = normalizedScenes.find((s) => s.id === state.currentScene.id);
          if (updatedCurrentScene) {
            state.currentScene = updatedCurrentScene;
          }
        }
      })
      .addCase(reorderScenes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to reorder scenes';
      });
  },
});

export const {
  clearSceneError,
  clearSceneSuccess,
  resetSceneState,
  setError,
  setCurrentScene,
  addScene,
  addLocallyCreatedScene,
  updateCreateAttempt,
  selectScene,
} = scenesSlice.actions;

export default scenesSlice.reducer;
