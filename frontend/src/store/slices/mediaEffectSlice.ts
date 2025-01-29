import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '../store';

interface BaseEffect {
  id: number;
  scene_id: number;
  start_time: number;
  duration: number;
  created_at: string;
  updated_at: string;
}

interface VisualEffect extends BaseEffect {
  effect_type: 'particle' | 'shader' | 'post_process' | 'environment';
  parameters: Record<string, any>;
}

interface AudioTrack extends BaseEffect {
  track_type: 'procedural' | 'ambient' | 'effect' | 'music';
  parameters: Record<string, any>;
  volume: number;
}

interface MediaEffectState {
  visualEffects: VisualEffect[];
  audioTracks: AudioTrack[];
  currentVisualEffect: VisualEffect | null;
  currentAudioTrack: AudioTrack | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: MediaEffectState = {
  visualEffects: [],
  audioTracks: [],
  currentVisualEffect: null,
  currentAudioTrack: null,
  isLoading: false,
  error: null,
};

// Visual Effects Thunks
export const fetchVisualEffects = createAsyncThunk(
  'mediaEffect/fetchVisualEffects',
  async (
    { universeId, storyboardId, sceneId }:
    { universeId: number; storyboardId: number; sceneId: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.get(
        `/api/universes/${universeId}/storyboards/${storyboardId}/scenes/${sceneId}/visual-effects`
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch visual effects');
    }
  }
);

export const createVisualEffect = createAsyncThunk(
  'mediaEffect/createVisualEffect',
  async (
    { universeId, storyboardId, sceneId, effectData }:
    { universeId: number; storyboardId: number; sceneId: number; effectData: Partial<VisualEffect> },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(
        `/api/universes/${universeId}/storyboards/${storyboardId}/scenes/${sceneId}/visual-effects`,
        effectData
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create visual effect');
    }
  }
);

export const updateVisualEffect = createAsyncThunk(
  'mediaEffect/updateVisualEffect',
  async (
    { universeId, storyboardId, sceneId, effectId, effectData }:
    { universeId: number; storyboardId: number; sceneId: number; effectId: number; effectData: Partial<VisualEffect> },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(
        `/api/universes/${universeId}/storyboards/${storyboardId}/scenes/${sceneId}/visual-effects/${effectId}`,
        effectData
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update visual effect');
    }
  }
);

export const deleteVisualEffect = createAsyncThunk(
  'mediaEffect/deleteVisualEffect',
  async (
    { universeId, storyboardId, sceneId, effectId }:
    { universeId: number; storyboardId: number; sceneId: number; effectId: number },
    { rejectWithValue }
  ) => {
    try {
      await axios.delete(
        `/api/universes/${universeId}/storyboards/${storyboardId}/scenes/${sceneId}/visual-effects/${effectId}`
      );
      return effectId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete visual effect');
    }
  }
);

// Audio Tracks Thunks
export const fetchAudioTracks = createAsyncThunk(
  'mediaEffect/fetchAudioTracks',
  async (
    { universeId, storyboardId, sceneId }:
    { universeId: number; storyboardId: number; sceneId: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.get(
        `/api/universes/${universeId}/storyboards/${storyboardId}/scenes/${sceneId}/audio-tracks`
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch audio tracks');
    }
  }
);

export const createAudioTrack = createAsyncThunk(
  'mediaEffect/createAudioTrack',
  async (
    { universeId, storyboardId, sceneId, trackData }:
    { universeId: number; storyboardId: number; sceneId: number; trackData: Partial<AudioTrack> },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(
        `/api/universes/${universeId}/storyboards/${storyboardId}/scenes/${sceneId}/audio-tracks`,
        trackData
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create audio track');
    }
  }
);

export const updateAudioTrack = createAsyncThunk(
  'mediaEffect/updateAudioTrack',
  async (
    { universeId, storyboardId, sceneId, trackId, trackData }:
    { universeId: number; storyboardId: number; sceneId: number; trackId: number; trackData: Partial<AudioTrack> },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(
        `/api/universes/${universeId}/storyboards/${storyboardId}/scenes/${sceneId}/audio-tracks/${trackId}`,
        trackData
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update audio track');
    }
  }
);

export const deleteAudioTrack = createAsyncThunk(
  'mediaEffect/deleteAudioTrack',
  async (
    { universeId, storyboardId, sceneId, trackId }:
    { universeId: number; storyboardId: number; sceneId: number; trackId: number },
    { rejectWithValue }
  ) => {
    try {
      await axios.delete(
        `/api/universes/${universeId}/storyboards/${storyboardId}/scenes/${sceneId}/audio-tracks/${trackId}`
      );
      return trackId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete audio track');
    }
  }
);

const mediaEffectSlice = createSlice({
  name: 'mediaEffect',
  initialState,
  reducers: {
    clearCurrentEffects: (state) => {
      state.currentVisualEffect = null;
      state.currentAudioTrack = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Visual Effects
      .addCase(fetchVisualEffects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVisualEffects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.visualEffects = action.payload;
      })
      .addCase(fetchVisualEffects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createVisualEffect.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createVisualEffect.fulfilled, (state, action) => {
        state.isLoading = false;
        state.visualEffects.push(action.payload);
        state.currentVisualEffect = action.payload;
      })
      .addCase(createVisualEffect.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateVisualEffect.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateVisualEffect.fulfilled, (state, action) => {
        state.isLoading = false;
        state.visualEffects = state.visualEffects.map(effect =>
          effect.id === action.payload.id ? action.payload : effect
        );
        state.currentVisualEffect = action.payload;
      })
      .addCase(updateVisualEffect.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteVisualEffect.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteVisualEffect.fulfilled, (state, action) => {
        state.isLoading = false;
        state.visualEffects = state.visualEffects.filter(effect => effect.id !== action.payload);
        if (state.currentVisualEffect?.id === action.payload) {
          state.currentVisualEffect = null;
        }
      })
      .addCase(deleteVisualEffect.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Audio Tracks
      .addCase(fetchAudioTracks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAudioTracks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.audioTracks = action.payload;
      })
      .addCase(fetchAudioTracks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createAudioTrack.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAudioTrack.fulfilled, (state, action) => {
        state.isLoading = false;
        state.audioTracks.push(action.payload);
        state.currentAudioTrack = action.payload;
      })
      .addCase(createAudioTrack.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateAudioTrack.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateAudioTrack.fulfilled, (state, action) => {
        state.isLoading = false;
        state.audioTracks = state.audioTracks.map(track =>
          track.id === action.payload.id ? action.payload : track
        );
        state.currentAudioTrack = action.payload;
      })
      .addCase(updateAudioTrack.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteAudioTrack.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteAudioTrack.fulfilled, (state, action) => {
        state.isLoading = false;
        state.audioTracks = state.audioTracks.filter(track => track.id !== action.payload);
        if (state.currentAudioTrack?.id === action.payload) {
          state.currentAudioTrack = null;
        }
      })
      .addCase(deleteAudioTrack.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentEffects, clearError } = mediaEffectSlice.actions;

export const selectVisualEffects = (state: RootState) => state.mediaEffect.visualEffects;
export const selectAudioTracks = (state: RootState) => state.mediaEffect.audioTracks;
export const selectCurrentVisualEffect = (state: RootState) => state.mediaEffect.currentVisualEffect;
export const selectCurrentAudioTrack = (state: RootState) => state.mediaEffect.currentAudioTrack;
export const selectMediaEffectLoading = (state: RootState) => state.mediaEffect.isLoading;
export const selectMediaEffectError = (state: RootState) => state.mediaEffect.error;

export default mediaEffectSlice.reducer;
