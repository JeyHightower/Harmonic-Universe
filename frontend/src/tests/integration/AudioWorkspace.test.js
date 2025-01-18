import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import AudioWorkspace from '../../components/AudioWorkspace';
import audioReducer from '../../redux/audioSlice';

const mockStore = configureStore({
  reducer: {
    audio: audioReducer,
  },
});

describe('AudioWorkspace Integration', () => {
  beforeEach(() => {
    // Reset any mocks and store before each test
    jest.clearAllMocks();
  });

  test('renders audio workspace with all main components', () => {
    render(
      <Provider store={mockStore}>
        <AudioWorkspace />
      </Provider>
    );

    expect(screen.getByTestId('audio-workspace')).toBeInTheDocument();
    expect(screen.getByTestId('track-list')).toBeInTheDocument();
    expect(screen.getByTestId('control-panel')).toBeInTheDocument();
  });

  test('track creation and deletion flow', async () => {
    render(
      <Provider store={mockStore}>
        <AudioWorkspace />
      </Provider>
    );

    // Add new track
    fireEvent.click(screen.getByTestId('add-track-button'));
    await waitFor(() => {
      expect(screen.getByTestId('track-1')).toBeInTheDocument();
    });

    // Delete track
    fireEvent.click(screen.getByTestId('delete-track-1'));
    await waitFor(() => {
      expect(screen.queryByTestId('track-1')).not.toBeInTheDocument();
    });
  });

  test('audio playback controls integration', async () => {
    render(
      <Provider store={mockStore}>
        <AudioWorkspace />
      </Provider>
    );

    const playButton = screen.getByTestId('play-button');
    const stopButton = screen.getByTestId('stop-button');

    // Test play functionality
    fireEvent.click(playButton);
    await waitFor(() => {
      expect(playButton).toHaveAttribute('aria-pressed', 'true');
    });

    // Test stop functionality
    fireEvent.click(stopButton);
    await waitFor(() => {
      expect(playButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  test('volume control integration', async () => {
    render(
      <Provider store={mockStore}>
        <AudioWorkspace />
      </Provider>
    );

    const volumeSlider = screen.getByTestId('master-volume');

    fireEvent.change(volumeSlider, { target: { value: '0.5' } });

    await waitFor(() => {
      expect(volumeSlider).toHaveValue('0.5');
    });
  });
});
