import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import MusicControls from '../../components/Music/MusicControls';
import { mockInitialState, renderWithProviders } from '../testSetup';

describe('MusicParameters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('adjusts rhythm complexity', async () => {
    const customState = {
      ...mockInitialState,
      audio: {
        ...mockInitialState.audio,
        tracks: [
          {
            ...mockInitialState.audio.tracks[0],
            parameters: {
              ...mockInitialState.audio.tracks[0].parameters,
              rhythmComplexity: 0.5,
            },
          },
        ],
      },
    };

    renderWithProviders(<MusicControls />, { preloadedState: customState });

    const slider = screen.getByRole('slider', { name: /rhythm complexity/i });
    expect(slider).toBeInTheDocument();

    fireEvent.change(slider, { target: { value: '0.7' } });
    expect(slider.value).toBe('0.7');
  });

  test('adjusts note density', async () => {
    const customState = {
      ...mockInitialState,
      audio: {
        ...mockInitialState.audio,
        tracks: [
          {
            ...mockInitialState.audio.tracks[0],
            parameters: {
              ...mockInitialState.audio.tracks[0].parameters,
              noteDensity: 0.5,
            },
          },
        ],
      },
    };

    renderWithProviders(<MusicControls />, { preloadedState: customState });

    const slider = screen.getByRole('slider', { name: /note density/i });
    expect(slider).toBeInTheDocument();

    fireEvent.change(slider, { target: { value: '0.8' } });
    expect(slider.value).toBe('0.8');
  });
});
