import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import audioReducer from '../redux/audioSlice';
import userReducer from '../redux/userSlice';

// Mock initial state
export const mockInitialState = {
  audio: {
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
  },
  user: {
    currentUser: null,
    notifications: [],
    isLoading: false,
    error: null,
  },
};

// Create a mock store
export const createMockStore = (preloadedState = mockInitialState) => {
  return configureStore({
    reducer: {
      audio: audioReducer,
      user: userReducer,
    },
    preloadedState,
  });
};

// Custom render function that includes Redux Provider
export const renderWithProviders = (
  ui,
  {
    preloadedState = mockInitialState,
    store = createMockStore(preloadedState),
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }) => {
    return <Provider store={store}>{children}</Provider>;
  };

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
};

// Mock Tone.js
jest.mock('tone', () => ({
  start: jest.fn().mockResolvedValue(undefined),
  Transport: {
    start: jest.fn(),
    stop: jest.fn(),
    schedule: jest.fn(),
    clear: jest.fn(),
    bpm: { value: 120 },
  },
  Synth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
    dispose: jest.fn(),
  })),
}));

// Mock WebSocket
export class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
    this.onopen = null;
  }

  send(data) {
    // Mock send implementation
  }

  close() {
    // Mock close implementation
  }
}

global.WebSocket = MockWebSocket;
