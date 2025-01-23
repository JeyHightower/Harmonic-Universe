import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { musicService } from '../../services/musicService';

const initialState = {
  audioContext: null,
  isPlaying: false,
  volume: 0.5,
  isMuted: false,
  currentTrack: null,
  playlist: [],
  soundEffects: {},
  loading: false,
  error: null,
};

export const loadTrack = createAsyncThunk(
  'music/loadTrack',
  async (trackUrl, { rejectWithValue }) => {
    try {
      const response = await musicService.loadAudioTrack(trackUrl);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to load audio track'
      );
    }
  }
);

export const loadSoundEffect = createAsyncThunk(
  'music/loadSoundEffect',
  async ({ name, url }, { rejectWithValue }) => {
    try {
      const response = await musicService.loadSoundEffect(url);
      return { name, data: response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to load sound effect'
      );
    }
  }
);

const musicSlice = createSlice({
  name: 'music',
  initialState,
  reducers: {
    setAudioContext: (state, action) => {
      state.audioContext = action.payload;
    },
    setPlaybackState: (state, action) => {
      state.isPlaying = action.payload;
    },
    setVolume: (state, action) => {
      state.volume = action.payload;
      if (action.payload > 0) {
        state.isMuted = false;
      }
    },
    toggleMute: state => {
      state.isMuted = !state.isMuted;
    },
    setCurrentTrack: (state, action) => {
      state.currentTrack = action.payload;
    },
    addToPlaylist: (state, action) => {
      state.playlist.push(action.payload);
    },
    removeFromPlaylist: (state, action) => {
      state.playlist = state.playlist.filter(
        track => track.id !== action.payload
      );
    },
    clearPlaylist: state => {
      state.playlist = [];
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Load Track
      .addCase(loadTrack.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadTrack.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTrack = action.payload;
      })
      .addCase(loadTrack.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Load Sound Effect
      .addCase(loadSoundEffect.fulfilled, (state, action) => {
        state.soundEffects[action.payload.name] = action.payload.data;
      })
      .addCase(loadSoundEffect.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const {
  setAudioContext,
  setPlaybackState,
  setVolume,
  toggleMute,
  setCurrentTrack,
  addToPlaylist,
  removeFromPlaylist,
  clearPlaylist,
  clearError,
} = musicSlice.actions;

export const selectAudioContext = state => state.music.audioContext;
export const selectIsPlaying = state => state.music.isPlaying;
export const selectVolume = state => state.music.volume;
export const selectIsMuted = state => state.music.isMuted;
export const selectCurrentTrack = state => state.music.currentTrack;
export const selectPlaylist = state => state.music.playlist;
export const selectSoundEffects = state => state.music.soundEffects;
export const selectMusicLoading = state => state.music.loading;
export const selectMusicError = state => state.music.error;

export default musicSlice.reducer;
