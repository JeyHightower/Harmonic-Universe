import api from '@/services/api';
import { AudioTrack, MIDIEvent, MIDISequence } from '@/types/audio';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

export interface AudioTrack {
  id: number;
  name: string;
  file_type: string;
  file_path: string;
  duration: number;
  volume: number;
  muted: boolean;
  solo: boolean;
  armed: boolean;
  midi_sequence_id?: number;
  effects: AudioEffect[];
  url?: string;
}

export interface AudioEffect {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  parameters: AudioEffectParameter[];
}

export interface AudioEffectParameter {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
}

export interface MIDISequence {
  id: number;
  trackId: number;
  duration: number;
  events: MIDIEvent[];
}

export interface MIDIEvent {
  id: number;
  time: number;
  trackId: number;
  type: 'note_on' | 'note_off' | 'control_change';
  timestamp: number;
  note?: number;
  velocity?: number;
  duration?: number;
  controller?: number;
  value?: number;
}

interface AudioFile {
  id: number;
  filename: string;
  file_type: string;
  duration: number;
  sample_rate: number;
  channels: number;
  user_id: number;
  project_id: number;
  created_at: string;
  updated_at: string;
}

interface AudioState {
  tracks: AudioTrack[];
  midiSequences: MIDISequence[];
  nextTrackId: number;
  nextMidiEventId: number;
  playbackState: {
    isPlaying: boolean;
    currentTime: number;
    tempo: number;
    isLooping: boolean;
    loopStart: number;
    loopEnd: number;
    isMetronomeEnabled: boolean;
    isSnapToGridEnabled: boolean;
    gridSize: number;
  };
  masterVolume: number;
  selectedTrackId: number | null;
  currentTrackId: number | null;
  isPlaying: boolean;
  loading: boolean;
  error: string | null;
  audioFiles: AudioFile[];
  currentAudio: AudioFile | null;
  currentTrack: AudioTrack | null;
  currentTime: number;
  duration: number;
  volume: number;
}

const initialState: AudioState = {
  tracks: [],
  midiSequences: [],
  nextTrackId: 1,
  nextMidiEventId: 1,
  playbackState: {
    isPlaying: false,
    currentTime: 0,
    tempo: 120,
    isLooping: false,
    loopStart: 0,
    loopEnd: 4,
    isMetronomeEnabled: false,
    isSnapToGridEnabled: true,
    gridSize: 0.25,
  },
  masterVolume: 1,
  selectedTrackId: null,
  currentTrackId: null,
  isPlaying: false,
  loading: false,
  error: null,
  audioFiles: [],
  currentAudio: null,
  currentTrack: null,
  currentTime: 0,
  duration: 0,
  volume: 1,
};

export const fetchTracks = createAsyncThunk('audio/fetchTracks', async (projectId: number) => {
  const response = await api.get(`/api/projects/${projectId}/audio`);
  return response.data;
});

export const createTrack = createAsyncThunk(
  'audio/createTrack',
  async (track: Omit<AudioTrack, 'id'>) => {
    const response = await api.post('/api/audio/tracks', track);
    return response.data;
  }
);

export const updateTrack = createAsyncThunk(
  'audio/updateTrack',
  async ({
    projectId,
    trackId,
    updates,
  }: {
    projectId: number;
    trackId: number;
    updates: Partial<AudioTrack>;
  }) => {
    const response = await api.put(`/api/projects/${projectId}/audio/${trackId}`, updates);
    return response.data;
  }
);

export const deleteTrack = createAsyncThunk(
  'audio/deleteTrack',
  async ({ projectId, trackId }: { projectId: number; trackId: number }) => {
    await api.delete(`/api/projects/${projectId}/audio/${trackId}`);
    return trackId;
  }
);

export const uploadAudio = createAsyncThunk(
  'audio/uploadAudio',
  async ({ projectId, formData }: { projectId: number; formData: FormData }) => {
    const response = await api.post(`/api/projects/${projectId}/audio`, formData);
    return response.data;
  }
);

export const fetchProjectAudio = createAsyncThunk(
  'audio/fetchProjectAudio',
  async (projectId: number) => {
    const response = await api.get(`/api/v1/project/${projectId}/audio`);
    return response.data;
  }
);

export const fetchAudioFile = createAsyncThunk('audio/fetchAudioFile', async (audioId: number) => {
  const response = await api.get(`/api/v1/audio/${audioId}`);
  return response.data;
});

export const deleteAudioFile = createAsyncThunk(
  'audio/deleteAudioFile',
  async (audioId: number) => {
    await api.delete(`/api/v1/audio/${audioId}`);
    return audioId;
  }
);

const audioSlice = createSlice({
  name: 'audio',
  initialState,
  reducers: {
    addTrack: (state, action: PayloadAction<Omit<AudioTrack, 'id' | 'effects'>>) => {
      state.tracks.push({
        ...action.payload,
        id: state.nextTrackId++,
        effects: [],
      });
    },
    updateTrackState: (
      state,
      action: PayloadAction<{ trackId: number; updates: Partial<AudioTrack> }>
    ) => {
      const track = state.tracks.find(t => t.id === action.payload.trackId);
      if (track) {
        Object.assign(track, action.payload.updates);
      }
    },
    deleteTrack: (state, action: PayloadAction<number>) => {
      state.tracks = state.tracks.filter(track => track.id !== action.payload);
      state.midiSequences = state.midiSequences.filter(seq => seq.trackId !== action.payload);
    },
    addMIDISequence: (state, action: PayloadAction<Omit<MIDISequence, 'events'>>) => {
      state.midiSequences.push({
        ...action.payload,
        events: [],
      });
    },
    addMIDIEvent: (
      state,
      action: PayloadAction<Omit<MIDIEvent, 'id'> & { sequence_id: number }>
    ) => {
      const sequence = state.midiSequences.find(seq => seq.id === action.payload.sequence_id);
      if (sequence) {
        sequence.events.push({
          ...action.payload,
          id: state.nextMidiEventId++,
        });
      }
    },
    updateMIDIEvent: (
      state,
      action: PayloadAction<Partial<MIDIEvent> & { id: number; sequence_id: number }>
    ) => {
      const sequence = state.midiSequences.find(seq => seq.id === action.payload.sequence_id);
      if (sequence) {
        const eventIndex = sequence.events.findIndex(event => event.id === action.payload.id);
        if (eventIndex !== -1) {
          sequence.events[eventIndex] = {
            ...sequence.events[eventIndex],
            ...action.payload,
          };
        }
      }
    },
    deleteMIDIEvent: (state, action: PayloadAction<{ id: number; sequence_id: number }>) => {
      const sequence = state.midiSequences.find(seq => seq.id === action.payload.sequence_id);
      if (sequence) {
        sequence.events = sequence.events.filter(event => event.id !== action.payload.id);
      }
    },
    setPlaybackState: (state, action: PayloadAction<Partial<AudioState['playbackState']>>) => {
      state.playbackState = {
        ...state.playbackState,
        ...action.payload,
      };
    },
    setMasterVolume: (state, action: PayloadAction<number>) => {
      state.masterVolume = action.payload;
    },
    setSelectedTrack: (state, action: PayloadAction<number | null>) => {
      state.selectedTrackId = action.payload;
    },
    clearAll: state => {
      state.tracks = [];
      state.midiSequences = [];
      state.nextTrackId = 1;
      state.nextMidiEventId = 1;
      state.playbackState.currentTime = 0;
      state.selectedTrackId = null;
    },
    setCurrentTrack: (state, action: PayloadAction<AudioTrack | null>) => {
      state.currentTrack = action.payload;
    },
    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
    },
    setDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload;
    },
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch Tracks
      .addCase(fetchTracks.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTracks.fulfilled, (state, action) => {
        state.loading = false;
        state.tracks = action.payload;
      })
      .addCase(fetchTracks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch tracks';
      })
      // Create Track
      .addCase(createTrack.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTrack.fulfilled, (state, action) => {
        state.loading = false;
        state.tracks.push(action.payload);
      })
      .addCase(createTrack.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create track';
      })
      // Update Track
      .addCase(updateTrack.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTrack.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tracks.findIndex(track => track.id === action.payload.id);
        if (index !== -1) {
          state.tracks[index] = action.payload;
        }
      })
      .addCase(updateTrack.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update track';
      })
      // Delete Track
      .addCase(deleteTrack.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTrack.fulfilled, (state, action) => {
        state.loading = false;
        state.tracks = state.tracks.filter(track => track.id !== action.payload);
        if (state.currentTrackId === action.payload) {
          state.currentTrackId = null;
        }
      })
      .addCase(deleteTrack.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete track';
      })
      // Upload Audio
      .addCase(uploadAudio.fulfilled, (state, action) => {
        state.tracks.push(action.payload);
      });
  },
});

export const {
  addTrack,
  updateTrackState,
  deleteTrack,
  addMIDISequence,
  addMIDIEvent,
  updateMIDIEvent,
  deleteMIDIEvent,
  setPlaybackState,
  setMasterVolume,
  setSelectedTrack,
  clearAll,
  setCurrentTrack,
  setCurrentTime,
  setDuration,
  setIsPlaying,
  setVolume,
  clearError,
} = audioSlice.actions;

export const selectAudioState = (state: RootState) => state.audio;
export const selectTracks = (state: RootState) => state.audio.tracks;
export const selectCurrentTrack = (state: RootState) => state.audio.currentTrack;
export const selectIsPlaying = (state: RootState) => state.audio.isPlaying;
export const selectCurrentTime = (state: RootState) => state.audio.currentTime;
export const selectDuration = (state: RootState) => state.audio.duration;
export const selectVolume = (state: RootState) => state.audio.volume;
export const selectError = (state: RootState) => state.audio.error;
export const selectLoading = (state: RootState) => state.audio.loading;

export default audioSlice.reducer;
