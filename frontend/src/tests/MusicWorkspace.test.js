import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import MusicWorkspace from '../components/Music/MusicWorkspace';
import * as audioSlice from '../store/slices/audioSlice';

// Mock Tone.js
jest.mock('tone', () => ({
  start: jest.fn(),
  Transport: {
    start: jest.fn(),
    stop: jest.fn(),
    bpm: { value: 120 },
  },
  Synth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
  })),
}));

const mockStore = configureStore([]);

describe('MusicWorkspace', () => {
  let store;

  const initialState = {
    audio: {
      isPlaying: false,
      tracks: [
        {
          id: 1,
          name: 'Track 1',
          isPlaying: false,
          isMuted: false,
          isSolo: false,
          volume: 0,
          pan: 0,
          notes: [],
          duration: 8,
          parameters: {
            attack: 0.05,
            decay: 0.2,
            sustain: 0.2,
            release: 1,
            scale: 'Major',
            rootNote: 'C4',
            chordProgression: 'I-IV-V',
            reverbDecay: 2,
            reverbWet: 0.2,
            delayTime: '16n',
            delayFeedback: 0.2,
            delayWet: 0.15,
            filterFreq: 5000,
            filterQ: 2,
            tempo: 120,
            probability: 0.8,
          },
        },
      ],
      activeTrackId: 1,
      masterVolume: 0,
    },
  };

  beforeEach(() => {
    store = mockStore(initialState);
    store.dispatch = jest.fn();
  });

  test('renders workspace header', () => {
    render(
      <Provider store={store}>
        <MusicWorkspace />
      </Provider>
    );

    expect(screen.getByText('Music Workspace')).toBeInTheDocument();
    expect(
      screen.getByText(/Create and edit musical sequences/i)
    ).toBeInTheDocument();
  });

  test('displays track list', () => {
    render(
      <Provider store={store}>
        <MusicWorkspace />
      </Provider>
    );

    expect(screen.getByText('Track 1')).toBeInTheDocument();
  });

  test('handles track selection', () => {
    render(
      <Provider store={store}>
        <MusicWorkspace />
      </Provider>
    );

    fireEvent.click(screen.getByText('Track 1'));
    expect(store.dispatch).toHaveBeenCalledWith(audioSlice.setActiveTrack(1));
  });

  test('displays error message when adding note without active track', () => {
    const storeWithoutActiveTrack = mockStore({
      ...initialState,
      audio: {
        ...initialState.audio,
        activeTrackId: null,
      },
    });

    render(
      <Provider store={storeWithoutActiveTrack}>
        <MusicWorkspace />
      </Provider>
    );

    // Simulate adding a note
    act(() => {
      const note = {
        id: 'test-note',
        pitch: 60,
        startTime: 0,
        duration: 0.25,
        velocity: 0.8,
      };
      fireEvent(
        screen.getByTestId('piano-roll'),
        new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
        })
      );
    });

    expect(screen.getByText('Please select a track first')).toBeInTheDocument();
  });
});
