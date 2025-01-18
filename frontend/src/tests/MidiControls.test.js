import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import MidiControls from '../components/Music/MidiControls';
import MidiService from '../services/MidiService';
import * as audioSlice from '../store/slices/audioSlice';

jest.mock('../services/MidiService');

const mockStore = configureStore([]);

describe('MidiControls', () => {
  let store;
  const mockOnError = jest.fn();

  const initialState = {
    audio: {
      tracks: [
        {
          id: 1,
          name: 'Track 1',
          notes: [
            {
              id: 'note1',
              pitch: 60,
              startTime: 0,
              duration: 0.5,
              velocity: 0.8,
            },
          ],
        },
      ],
    },
  };

  beforeEach(() => {
    store = mockStore(initialState);
    store.dispatch = jest.fn();
    mockOnError.mockClear();
    MidiService.parseMidiFile.mockClear();
    MidiService.exportMidiFile.mockClear();
  });

  test('renders import and export buttons', () => {
    render(
      <Provider store={store}>
        <MidiControls onError={mockOnError} />
      </Provider>
    );

    expect(screen.getByText('Import MIDI')).toBeInTheDocument();
    expect(screen.getByText('Export MIDI')).toBeInTheDocument();
  });

  test('handles MIDI file import', async () => {
    const mockMidiData = {
      name: 'test.mid',
      duration: 4,
      tracks: [
        {
          name: 'Test Track',
          notes: [
            {
              pitch: 60,
              time: 0,
              duration: 0.5,
              velocity: 0.8,
            },
          ],
          channel: 1,
          instrument: 'acoustic_grand_piano',
        },
      ],
    };

    const mockSequences = [
      {
        id: 'track1',
        name: 'Test Track',
        notes: [
          {
            id: 'note1',
            pitch: 60,
            startTime: 0,
            duration: 0.5,
            velocity: 0.8,
          },
        ],
      },
    ];

    MidiService.parseMidiFile.mockResolvedValue(mockMidiData);
    MidiService.convertMidiToSequence.mockReturnValue(mockSequences);

    render(
      <Provider store={store}>
        <MidiControls onError={mockOnError} />
      </Provider>
    );

    const mockArrayBuffer = new ArrayBuffer(8);
    const file = new File([''], 'test.mid', { type: 'audio/midi' });
    Object.defineProperty(file, 'arrayBuffer', {
      value: jest.fn().mockResolvedValue(mockArrayBuffer),
    });

    const input = screen.getByRole('textbox', { hidden: true });

    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);

    await expect(MidiService.parseMidiFile).toHaveBeenCalledWith(file);
    expect(MidiService.convertMidiToSequence).toHaveBeenCalledWith(
      mockMidiData
    );
    expect(store.dispatch).toHaveBeenCalledWith(
      audioSlice.setTracks(mockSequences)
    );
  });

  test('handles MIDI file import error', async () => {
    const error = new Error('Invalid MIDI file');
    MidiService.parseMidiFile.mockRejectedValue(error);

    render(
      <Provider store={store}>
        <MidiControls onError={mockOnError} />
      </Provider>
    );

    const mockArrayBuffer = new ArrayBuffer(8);
    const file = new File([''], 'test.mid', { type: 'audio/midi' });
    Object.defineProperty(file, 'arrayBuffer', {
      value: jest.fn().mockResolvedValue(mockArrayBuffer),
    });

    const input = screen.getByRole('textbox', { hidden: true });

    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);

    await expect(mockOnError).toHaveBeenCalledWith(error.message);
  });

  test('handles MIDI export', async () => {
    const mockMidiTracks = [
      {
        name: 'Track 1',
        notes: [
          {
            pitch: 60,
            time: 0,
            duration: 0.5,
            velocity: 0.8,
          },
        ],
      },
    ];

    MidiService.convertSequenceToMidi.mockReturnValue(mockMidiTracks);

    render(
      <Provider store={store}>
        <MidiControls onError={mockOnError} />
      </Provider>
    );

    fireEvent.click(screen.getByText('Export MIDI'));

    expect(MidiService.convertSequenceToMidi).toHaveBeenCalledWith(
      initialState.audio.tracks
    );
    expect(MidiService.exportMidiFile).toHaveBeenCalledWith(
      mockMidiTracks,
      'harmonic_universe_sequence.mid'
    );
  });

  test('handles MIDI export error', async () => {
    const error = new Error('Export failed');
    MidiService.exportMidiFile.mockRejectedValue(error);

    render(
      <Provider store={store}>
        <MidiControls onError={mockOnError} />
      </Provider>
    );

    fireEvent.click(screen.getByText('Export MIDI'));

    await expect(mockOnError).toHaveBeenCalledWith(error.message);
  });

  test('disables export button when no tracks available', () => {
    const emptyStore = mockStore({
      audio: {
        tracks: [],
      },
    });

    render(
      <Provider store={emptyStore}>
        <MidiControls onError={mockOnError} />
      </Provider>
    );

    expect(screen.getByText('Export MIDI')).toBeDisabled();
  });

  test('clears file input after import', async () => {
    MidiService.parseMidiFile.mockResolvedValue({});
    MidiService.convertMidiToSequence.mockReturnValue([]);

    render(
      <Provider store={store}>
        <MidiControls onError={mockOnError} />
      </Provider>
    );

    const mockArrayBuffer = new ArrayBuffer(8);
    const file = new File([''], 'test.mid', { type: 'audio/midi' });
    Object.defineProperty(file, 'arrayBuffer', {
      value: jest.fn().mockResolvedValue(mockArrayBuffer),
    });

    const input = screen.getByRole('textbox', { hidden: true });

    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);

    await expect(input.value).toBe('');
  });
});
