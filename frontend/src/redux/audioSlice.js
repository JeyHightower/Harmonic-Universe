import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isPlaying: false,
  tracks: [
    {
      id: 1,
      name: 'Track 1',
      isMuted: false,
      isSolo: false,
      volume: 0,
      pan: 0,
      parameters: {
        attack: 0.05,
        decay: 0.2,
        sustain: 0.2,
        release: 1,
        rootNote: 'C4',
        scale: 'Major',
      },
    },
  ],
  activeTrackId: 1,
  masterVolume: 1,
  midiFile: null,
  frequencies: {
    bass: 0,
    mid: 0,
    high: 0,
  },
  error: null,
};

const audioSlice = createSlice({
  name: 'audio',
  initialState,
  reducers: {
    setIsPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },
    addTrack: (state, action) => {
      state.tracks.push(action.payload);
    },
    removeTrack: (state, action) => {
      state.tracks = state.tracks.filter(track => track.id !== action.payload);
    },
    setActiveTrack: (state, action) => {
      state.activeTrackId = action.payload;
    },
    updateTrackParameters: (state, action) => {
      const { trackId, parameters } = action.payload;
      const track = state.tracks.find(t => t.id === trackId);
      if (track) {
        track.parameters = { ...track.parameters, ...parameters };
      }
    },
    setTrackMute: (state, action) => {
      const { trackId, isMuted } = action.payload;
      const track = state.tracks.find(t => t.id === trackId);
      if (track) {
        track.isMuted = isMuted;
      }
    },
    setTrackSolo: (state, action) => {
      const { trackId, isSolo } = action.payload;
      const track = state.tracks.find(t => t.id === trackId);
      if (track) {
        track.isSolo = isSolo;
      }
    },
    setTrackVolume: (state, action) => {
      const { trackId, volume } = action.payload;
      const track = state.tracks.find(t => t.id === trackId);
      if (track) {
        track.volume = volume;
      }
    },
    setTrackPan: (state, action) => {
      const { trackId, pan } = action.payload;
      const track = state.tracks.find(t => t.id === trackId);
      if (track) {
        track.pan = pan;
      }
    },
    setMasterVolume: (state, action) => {
      state.masterVolume = action.payload;
    },
    setMidiFile: (state, action) => {
      state.midiFile = action.payload;
    },
    setFrequencies: (state, action) => {
      state.frequencies = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    resetError: state => {
      state.error = null;
    },
    resetState: () => initialState,
  },
});

// Export actions
export const {
  setIsPlaying,
  addTrack,
  removeTrack,
  setActiveTrack,
  updateTrackParameters,
  setTrackMute,
  setTrackSolo,
  setTrackVolume,
  setTrackPan,
  setMasterVolume,
  setMidiFile,
  setFrequencies,
  setError,
  resetError,
  resetState,
} = audioSlice.actions;

// Selectors
export const selectIsPlaying = state => state.audio.isPlaying;
export const selectTracks = state => state.audio.tracks;
export const selectActiveTrackId = state => state.audio.activeTrackId;
export const selectActiveTrack = state =>
  state.audio.tracks.find(track => track.id === state.audio.activeTrackId);
export const selectMasterVolume = state => state.audio.masterVolume;
export const selectMidiFile = state => state.audio.midiFile;
export const selectFrequencies = state => state.audio.frequencies;
export const selectError = state => state.audio.error;

export default audioSlice.reducer;
