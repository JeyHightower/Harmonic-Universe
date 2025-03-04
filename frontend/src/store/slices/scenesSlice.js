import { createSlice } from '@reduxjs/toolkit';
import {
    fetchScenes,
    fetchSceneById,
    createScene,
    updateScene,
    deleteScene,
    reorderScenes
} from '../thunks/scenesThunks';

const initialState = {
    scenes: [],
    currentScene: null,
    loading: false,
    error: null,
};

const scenesSlice = createSlice({
    name: 'scenes',
    initialState,
    reducers: {
        clearScenes: (state) => {
            state.scenes = [];
            state.currentScene = null;
        },
        clearCurrentScene: (state) => {
            state.currentScene = null;
        },
        clearError: (state) => {
            state.error = null;
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
                state.scenes = action.payload;
                state.loading = false;
            })
            .addCase(fetchScenes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message;
            })

            // fetchSceneById
            .addCase(fetchSceneById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSceneById.fulfilled, (state, action) => {
                state.currentScene = action.payload;
                state.loading = false;
            })
            .addCase(fetchSceneById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message;
            })

            // createScene
            .addCase(createScene.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createScene.fulfilled, (state, action) => {
                state.scenes.push(action.payload);
                state.loading = false;
            })
            .addCase(createScene.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message;
            })

            // updateScene
            .addCase(updateScene.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateScene.fulfilled, (state, action) => {
                const updatedScene = action.payload;

                // Update in scenes array
                const index = state.scenes.findIndex((scene) => scene.id === updatedScene.id);
                if (index !== -1) {
                    state.scenes[index] = updatedScene;
                }

                // Update currentScene if it's the same scene
                if (state.currentScene && state.currentScene.id === updatedScene.id) {
                    state.currentScene = updatedScene;
                }

                state.loading = false;
            })
            .addCase(updateScene.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message;
            })

            // deleteScene
            .addCase(deleteScene.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteScene.fulfilled, (state, action) => {
                const deletedSceneId = action.payload;
                state.scenes = state.scenes.filter((scene) => scene.id !== deletedSceneId);

                if (state.currentScene && state.currentScene.id === deletedSceneId) {
                    state.currentScene = null;
                }

                state.loading = false;
            })
            .addCase(deleteScene.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message;
            })

            // reorderScenes
            .addCase(reorderScenes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(reorderScenes.fulfilled, (state, action) => {
                // Replace the scenes with the reordered scenes
                state.scenes = action.payload;
                state.loading = false;
            })
            .addCase(reorderScenes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message;
            });
    },
});

export const { clearScenes, clearCurrentScene, clearError } = scenesSlice.actions;

export default scenesSlice.reducer;
