import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '../store';

interface Scene {
  id: number;
  storyboard_id: number;
  title: string;
  sequence: number;
  content: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface SceneState {
  scenes: Scene[];
  currentScene: Scene | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SceneState = {
  scenes: [],
  currentScene: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchScenes = createAsyncThunk(
  'scene/fetchScenes',
  async ({ universeId, storyboardId }: { universeId: number; storyboardId: number }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/universes/${universeId}/storyboards/${storyboardId}/scenes`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch scenes');
    }
  }
);

export const fetchSceneById = createAsyncThunk(
  'scene/fetchSceneById',
  async (
    { universeId, storyboardId, sceneId }:
    { universeId: number; storyboardId: number; sceneId: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.get(
        `/api/universes/${universeId}/storyboards/${storyboardId}/scenes/${sceneId}`
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch scene');
    }
  }
);

export const createScene = createAsyncThunk(
  'scene/createScene',
  async (
    { universeId, storyboardId, sceneData }:
    { universeId: number; storyboardId: number; sceneData: Partial<Scene> },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(
        `/api/universes/${universeId}/storyboards/${storyboardId}/scenes`,
        sceneData
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create scene');
    }
  }
);

export const updateScene = createAsyncThunk(
  'scene/updateScene',
  async (
    { universeId, storyboardId, sceneId, sceneData }:
    { universeId: number; storyboardId: number; sceneId: number; sceneData: Partial<Scene> },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(
        `/api/universes/${universeId}/storyboards/${storyboardId}/scenes/${sceneId}`,
        sceneData
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update scene');
    }
  }
);

export const deleteScene = createAsyncThunk(
  'scene/deleteScene',
  async (
    { universeId, storyboardId, sceneId }:
    { universeId: number; storyboardId: number; sceneId: number },
    { rejectWithValue }
  ) => {
    try {
      await axios.delete(
        `/api/universes/${universeId}/storyboards/${storyboardId}/scenes/${sceneId}`
      );
      return sceneId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete scene');
    }
  }
);

export const reorderScenes = createAsyncThunk(
  'scene/reorderScenes',
  async (
    { universeId, storyboardId, sceneIds }:
    { universeId: number; storyboardId: number; sceneIds: number[] },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(
        `/api/universes/${universeId}/storyboards/${storyboardId}/scenes/reorder`,
        { scene_ids: sceneIds }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to reorder scenes');
    }
  }
);

const sceneSlice = createSlice({
  name: 'scene',
  initialState,
  reducers: {
    clearCurrentScene: (state) => {
      state.currentScene = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Scenes
      .addCase(fetchScenes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchScenes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.scenes = action.payload;
      })
      .addCase(fetchScenes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Single Scene
      .addCase(fetchSceneById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSceneById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentScene = action.payload;
      })
      .addCase(fetchSceneById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Scene
      .addCase(createScene.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createScene.fulfilled, (state, action) => {
        state.isLoading = false;
        state.scenes.push(action.payload);
        state.currentScene = action.payload;
      })
      .addCase(createScene.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Scene
      .addCase(updateScene.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateScene.fulfilled, (state, action) => {
        state.isLoading = false;
        state.scenes = state.scenes.map(scene =>
          scene.id === action.payload.id ? action.payload : scene
        );
        state.currentScene = action.payload;
      })
      .addCase(updateScene.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete Scene
      .addCase(deleteScene.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteScene.fulfilled, (state, action) => {
        state.isLoading = false;
        state.scenes = state.scenes.filter(scene => scene.id !== action.payload);
        if (state.currentScene?.id === action.payload) {
          state.currentScene = null;
        }
      })
      .addCase(deleteScene.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Reorder Scenes
      .addCase(reorderScenes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(reorderScenes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.scenes = action.payload;
      })
      .addCase(reorderScenes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentScene, clearError } = sceneSlice.actions;

export const selectScenes = (state: RootState) => state.scene.scenes;
export const selectCurrentScene = (state: RootState) => state.scene.currentScene;
export const selectSceneLoading = (state: RootState) => state.scene.isLoading;
export const selectSceneError = (state: RootState) => state.scene.error;

export default sceneSlice.reducer;
