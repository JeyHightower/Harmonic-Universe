import api from '@/services/api';

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

/**
 * @typedef {Object} AudioTrack
 * @property {number} id
 * @property {string} name
 * @property {string} file_type
 * @property {string} file_path
 * @property {number} duration
 * @property {number} volume
 * @property {boolean} muted
 * @property {boolean} solo
 * @property {boolean} armed
 * @property {number} [midi_sequence_id]
 * @property {AudioEffect[]} effects
 * @property {string} [url]
 */

/**
 * @typedef {Object} AudioEffect
 * @property {string} id
 * @property {string} type
 * @property {string} name
 * @property {boolean} enabled
 * @property {AudioEffectParameter[]} parameters
 */

/**
 * @typedef {Object} AudioEffectParameter
 * @property {string} name
 * @property {number} value
 * @property {number} min
 * @property {number} max
 * @property {number} step
 */

/**
 * @typedef {Object} MIDISequence
 * @property {number} id
 * @property {number} trackId
 * @property {number} duration
 * @property {MIDIEvent[]} events
 */

/**
 * @typedef {Object} MIDIEvent
 * @property {number} id
 * @property {number} time
 * @property {number} trackId
 * @property {('note_on'|'note_off'|'control_change')} type
 * @property {number} timestamp
 * @property {number} [note]
 * @property {number} [velocity]
 * @property {number} [duration]
 * @property {number} [controller]
 * @property {number} [value]
 */

/**
 * @typedef {Object} AudioState
 * @property {AudioTrack[]} tracks
 * @property {MIDISequence[]} midiSequences
 * @property {number} nextTrackId
 * @property {number} nextMidiEventId
 * @property {Object} playbackState
 * @property {boolean} playbackState.isPlaying
 * @property {number} playbackState.currentTime
 * @property {number} playbackState.tempo
 * @property {boolean} playbackState.isLooping
 * @property {number} playbackState.loopStart
 * @property {number} playbackState.loopEnd
 * @property {boolean} playbackState.isMetronomeEnabled
 * @property {boolean} playbackState.isSnapToGridEnabled
 * @property {number} playbackState.gridSize
 * @property {number} masterVolume
 * @property {number|null} selectedTrackId
 * @property {number|null} currentTrackId
 * @property {boolean} isPlaying
 * @property {boolean} loading
 * @property {string|null} error
 * @property {Array} audioFiles
 * @property {Object|null} currentAudio
 * @property {Object|null} currentTrack
 * @property {number} currentTime
 * @property {number} duration
 * @property {number} volume
 */

const initialState = {
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

export const fetchTracks = createAsyncThunk('audio/fetchTracks', async (projectId) => {
  const response = await api.get(`/api/projects/${projectId}/audio`);
  return response.data;
});

export const createTrack = createAsyncThunk(
  'audio/createTrack',
  async ({ projectId, track }) => {
    const response = await api.post('/api/audio/tracks', track);
    return response.data;
  }
);

export const updateTrack = createAsyncThunk(
  'audio/updateTrack',
  async ({ projectId, trackId, updates }) => {
    const response = await api.put(`/api/audio/tracks/${trackId}`, updates);
    return response.data;
  }
);

export const deleteTrack = createAsyncThunk(
  'audio/deleteTrack',
  async ({ projectId, trackId }) => {
    await api.delete(`/api/audio/tracks/${trackId}`);
    return trackId;
  }
);

export const uploadAudio = createAsyncThunk(
  'audio/uploadAudio',
  async ({ projectId, formData }) => {
    const response = await api.post(`/api/audio/upload/${projectId}`, formData);
    return response.data;
  }
);

export const fetchProjectAudio = createAsyncThunk(
  'audio/fetchProjectAudio',
  async (projectId) => {
    const response = await api.get(`/api/audio/project/${projectId}`);
    return response.data;
  }
);

export const fetchAudioFile = createAsyncThunk('audio/fetchAudioFile', async (audioId) => {
  const response = await api.get(`/api/v1/audio/${audioId}`);
  return response.data;
});

export const deleteAudioFile = createAsyncThunk(
  'audio/deleteAudioFile',
  async (audioId) => {
    await api.delete(`/api/v1/audio/${audioId}`);
    return audioId;
  }
);

const audioSlice = createSlice({
  name: 'audio',
  initialState,
  reducers: {
    addTrack: (state, action) => {
      state.tracks.push({
        ...action.payload,
        id: state.nextTrackId++,
        effects: [],
      });
    },
    updateTrackState: (state, action) => {
      const track = state.tracks.find(t => t.id === action.payload.trackId);
      if (track) {
        Object.assign(track, action.payload.updates);
      }
    },
    deleteTrack: (state, action) => {
      state.tracks = state.tracks.filter(track => track.id !== action.payload);
      state.midiSequences = state.midiSequences.filter(seq => seq.trackId !== action.payload);
    },
    addMIDISequence: (state, action) => {
      state.midiSequences.push({
        ...action.payload,
        events: [],
      });
    },
    addMIDIEvent: (state, action) => {
      const sequence = state.midiSequences.find(seq => seq.id === action.payload.sequence_id);
      if (sequence) {
        sequence.events.push({
          ...action.payload,
          id: state.nextMidiEventId++,
        });
      }
    },
    updateMIDIEvent: (state, action) => {
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
    deleteMIDIEvent: (state, action) => {
      const sequence = state.midiSequences.find(seq => seq.id === action.payload.sequence_id);
      if (sequence) {
        sequence.events = sequence.events.filter(event => event.id !== action.payload.id);
      }
    },
    setPlaybackState: (state, action) => {
      state.playbackState = {
        ...state.playbackState,
        ...action.payload,
      };
    },
    setMasterVolume: (state, action) => {
      state.masterVolume = action.payload;
    },
    setSelectedTrack: (state, action) => {
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
      state.currentTrack = action.payload;
    },
    setCurrentTime: (state, action) => {
      state.currentTime = action.payload;
    },
    setDuration: (state, action) => {
      state.duration = action.payload;
    },
    setIsPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },
    setVolume: (state, action) => {
      state.volume = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tracks
      .addCase(fetchTracks.pending, (state) => {
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
      .addCase(createTrack.pending, (state) => {
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
      .addCase(updateTrack.pending, (state) => {
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
      .addCase(deleteTrack.pending, (state) => {
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
      .addCase(uploadAudio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadAudio.fulfilled, (state, action) => {
        state.loading = false;
        state.audioFiles.push(action.payload);
      })
      .addCase(uploadAudio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchProjectAudio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectAudio.fulfilled, (state, action) => {
        state.loading = false;
        state.audioFiles = action.payload;
      })
      .addCase(fetchProjectAudio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchAudioFile.fulfilled, (state, action) => {
        state.currentAudio = action.payload;
      })
      .addCase(deleteAudioFile.fulfilled, (state, action) => {
        state.audioFiles = state.audioFiles.filter(file => file.id !== action.payload);
      });
  },
});

export const {
  addTrack,
  updateTrackState,
  deleteTrack: deleteTrackAction,
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

export const selectAudioState = (state) => state.audio;
export const selectTracks = (state) => state.audio.tracks;
export const selectCurrentTrack = (state) => state.audio.currentTrack;
export const selectIsPlaying = (state) => state.audio.isPlaying;
export const selectVolume = (state) => state.audio.volume;
export const selectDuration = (state) => state.audio.duration;
export const selectCurrentTime = (state) => state.audio.currentTime;
export const selectLoading = (state) => state.audio.loading;
export const selectError = (state) => state.audio.error;
export const selectAudioFiles = (state) => state.audio.audioFiles;

export default audioSlice.reducer;
