import { createSlice } from '@reduxjs/toolkit';

const createDefaultTrack = id => ({
  id,
  name: `Track ${id}`,
  isPlaying: false,
  isMuted: false,
  isSolo: false,
  volume: 0,
  pan: 0,
  currentSequence: null,
  parameters: {
    // Synth parameters
    attack: 0.05,
    decay: 0.2,
    sustain: 0.2,
    release: 1,

    // Effects parameters
    reverbDecay: 5,
    reverbWet: 0.3,
    delayTime: '8n',
    delayFeedback: 0.3,
    delayWet: 0.2,
    filterFreq: 1000,
    filterQ: 1,

    // Sequence parameters
    scale: 'Major',
    rootNote: 'C4',
    tempo: 120,
    noteLength: '8n',
    probability: 0.7,
    chordProgression: 'I-IV-V',

    // Scale parameters
    scaleNotes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'],
    chordProgressionNotes: [],

    // Analysis parameters
    bassFrequency: 0,
    midFrequency: 0,
    highFrequency: 0,
  },
});

const initialState = {
  isPlaying: false,
  tempo: 120,
  tracks: [createDefaultTrack(1)],
  activeTrackId: 1,
  masterVolume: 0,
  error: null,
  midiFile: null,
  suggestions: [],
};

const audioSlice = createSlice({
  name: 'audio',
  initialState,
  reducers: {
    setIsPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },
    addTrack: state => {
      const newId = state.tracks.length + 1;
      state.tracks.push(createDefaultTrack(newId));
    },
    removeTrack: (state, action) => {
      if (state.tracks.length > 1) {
        state.tracks = state.tracks.filter(
          track => track.id !== action.payload
        );
        if (state.activeTrackId === action.payload) {
          state.activeTrackId = state.tracks[0].id;
        }
      }
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
    setTrackSequence: (state, action) => {
      const { trackId, sequence } = action.payload;
      const track = state.tracks.find(t => t.id === trackId);
      if (track) {
        track.currentSequence = sequence;
      }
    },
    setTrackMute: (state, action) => {
      const { trackId, isMuted } = action.payload;
      const track = state.tracks.find(t => t.id === trackId);
      if (track) {
        track.isMuted = isMuted;
        if (isMuted) track.isSolo = false;
      }
    },
    setTrackSolo: (state, action) => {
      const { trackId, isSolo } = action.payload;
      const track = state.tracks.find(t => t.id === trackId);
      if (track) {
        track.isSolo = isSolo;
        if (isSolo) track.isMuted = false;
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
    updateAnalysisParameters: (state, action) => {
      const { trackId, parameters } = action.payload;
      const track = state.tracks.find(t => t.id === trackId);
      if (track) {
        track.parameters.bassFrequency = parameters.bassFrequency;
        track.parameters.midFrequency = parameters.midFrequency;
        track.parameters.highFrequency = parameters.highFrequency;
      }
    },
    setSuggestions: (state, action) => {
      state.suggestions = action.payload;
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

export const selectParameters = state => {
  const activeTrack = state.audio.tracks.find(
    track => track.id === state.audio.activeTrackId
  );
  return activeTrack ? activeTrack.parameters : state.audio.parameters;
};

export const {
  setIsPlaying,
  addTrack,
  removeTrack,
  setActiveTrack,
  updateTrackParameters,
  setTrackSequence,
  setTrackMute,
  setTrackSolo,
  setTrackVolume,
  setTrackPan,
  setMasterVolume,
  setMidiFile,
  updateAnalysisParameters,
  setSuggestions,
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
export const selectSuggestions = state => state.audio.suggestions;
export const selectError = state => state.audio.error;

export default audioSlice.reducer;
