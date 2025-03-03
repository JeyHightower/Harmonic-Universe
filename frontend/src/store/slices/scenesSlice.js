import { createSlice } from '@reduxjs/toolkit';
import {
    createScene,
    deleteScene,
    fetchScenes,
    updateScene,
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
        setCurrentScene: (state, action) => {
            state.currentScene = action.payload;
        },
        clearCurrentScene: state => {
            state.currentScene = null;
        },
        clearError: state => {
            state.error = null;
        },
        resetState: () => initialState,
    },
    extraReducers: builder => {
        // Fetch scenes
        builder
            .addCase(fetchScenes.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchScenes.fulfilled, (state, action) => {
                state.loading = false;
                state.scenes = action.payload;
                state.error = null;
            })
            .addCase(fetchScenes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Create scene
            .addCase(createScene.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createScene.fulfilled, (state, action) => {
                state.loading = false;
                state.scenes.push(action.payload);
                state.currentScene = action.payload;
                state.error = null;
            })
            .addCase(createScene.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Update scene
            .addCase(updateScene.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateScene.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.scenes.findIndex(
                    scene => scene.id === action.payload.id
                );
                if (index !== -1) {
                    state.scenes[index] = action.payload;
                }
                if (state.currentScene?.id === action.payload.id) {
                    state.currentScene = action.payload;
                }
                state.error = null;
            })
            .addCase(updateScene.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Delete scene
            .addCase(deleteScene.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteScene.fulfilled, (state, action) => {
                state.loading = false;
                state.scenes = state.scenes.filter(
                    scene => scene.id !== action.payload
                );
                if (state.currentScene?.id === action.payload) {
                    state.currentScene = null;
                }
                state.error = null;
            })
            .addCase(deleteScene.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const {
    setCurrentScene,
    clearCurrentScene,
    clearError,
    resetState,
} = scenesSlice.actions;

export default scenesSlice.reducer;
