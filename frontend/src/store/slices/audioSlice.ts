import axiosInstance from '@/services/api';
import { AudioTrack } from '@/types';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export interface AudioTrack {
  id: number;
  name: string;
  file_type: string;
  file_path: string;
  duration: number;
  volume: number;
  is_muted: boolean;
  is_solo: boolean;
  is_armed: boolean;
  midi_sequence_id?: number;
  effects: AudioEffect[];
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
  track_id: number;
  duration: number;
  events: MIDIEvent[];
}

export interface MIDIEvent {
  id: number;
  event_type: 'note_on' | 'note_off' | 'control_change';
  timestamp: number;
  note?: number;
  velocity?: number;
  duration?: number;
  controller?: number;
  value?: number;
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
    gridSize: 0.25, // Quarter note
  },
  masterVolume: 1,
  selectedTrackId: null,
  currentTrackId: null,
  isPlaying: false,
  loading: false,
  error: null,
};

export const fetchTracks = createAsyncThunk('audio/fetchTracks', async () => {
  const response = await axiosInstance.get('/audio/tracks');
  return response.data;
});

export const createTrack = createAsyncThunk(
  'audio/createTrack',
  async (track: Omit<AudioTrack, 'id'>) => {
    const response = await axiosInstance.post('/audio/tracks', track);
    return response.data;
  }
);

export const updateTrackAsync = createAsyncThunk(
  'audio/updateTrack',
  async ({ id, ...updates }: Partial<AudioTrack> & { id: number }) => {
    const response = await axiosInstance.patch(`/audio/tracks/${id}`, updates);
    return response.data;
  }
);

export const deleteTrackAsync = createAsyncThunk('audio/deleteTrack', async (id: number) => {
  await axiosInstance.delete(`/audio/tracks/${id}`);
  return id;
});

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
    updateTrack: (state, action: PayloadAction<Partial<AudioTrack> & { id: number }>) => {
      const index = state.tracks.findIndex(track => track.id === action.payload.id);
      if (index !== -1) {
        state.tracks[index] = {
          ...state.tracks[index],
          ...action.payload,
        };
      }
    },
    deleteTrack: (state, action: PayloadAction<number>) => {
      state.tracks = state.tracks.filter(track => track.id !== action.payload);
      state.midiSequences = state.midiSequences.filter(seq => seq.track_id !== action.payload);
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
    setCurrentTrack: (state, action) => {
      state.currentTrackId = action.payload;
    },
    setCurrentTime: (state, action) => {
      state.playbackState.currentTime = action.payload;
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
      .addCase(updateTrackAsync.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTrackAsync.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tracks.findIndex(track => track.id === action.payload.id);
        if (index !== -1) {
          state.tracks[index] = action.payload;
        }
      })
      .addCase(updateTrackAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update track';
      })
      // Delete Track
      .addCase(deleteTrackAsync.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTrackAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.tracks = state.tracks.filter(track => track.id !== action.payload);
        if (state.currentTrackId === action.payload) {
          state.currentTrackId = null;
        }
      })
      .addCase(deleteTrackAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete track';
      });
  },
});

export const {
  addTrack,
  updateTrack,
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
  clearError,
} = audioSlice.actions;

export default audioSlice.reducer;
