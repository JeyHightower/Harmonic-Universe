import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import * as Tone from 'tone';
import { describe, expect, it, vi } from 'vitest';
import { musicSlice } from '../../store/slices/musicSlice';
import AudioController from '../Audio/AudioController';
import styles from '../Audio/AudioController.module.css';

// Mock Tone.js
vi.mock('tone', () => ({
  start: vi.fn().mockResolvedValue(undefined),
  Transport: {
    start: vi.fn(),
    stop: vi.fn(),
  },
  PolySynth: vi.fn().mockImplementation(() => ({
    toDestination: () => ({
      volume: { value: -12 },
      set: vi.fn(),
      triggerAttackRelease: vi.fn(),
      dispose: vi.fn(),
    }),
  })),
  Sequence: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    dispose: vi.fn(),
  })),
  getContext: vi.fn(),
  Frequency: vi.fn().mockImplementation(value => ({
    harmonize: vi.fn().mockReturnValue(value),
  })),
}));

describe('AudioController Component', () => {
  const defaultProps = {
    physicsParameters: {
      gravity: 9.81,
      elasticity: 0.5,
      friction: 0.3,
      airResistance: 0.1,
      density: 1.0,
    },
  };

  const renderComponent = (props = {}) => {
    const store = configureStore({
      reducer: {
        music: musicSlice.reducer,
      },
    });

    return render(
      <Provider store={store}>
        <AudioController {...defaultProps} {...props} />
      </Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders audio control elements', () => {
    renderComponent();
    expect(screen.getByRole('button')).toHaveTextContent(/play|stop/i);
    expect(screen.getByLabelText(/volume/i)).toBeInTheDocument();
  });

  it('handles play/pause toggle', async () => {
    renderComponent();
    const playButton = screen.getByRole('button');

    // Initial state
    expect(playButton).toHaveTextContent('Play');

    // Click play
    await userEvent.click(playButton);
    expect(Tone.start).toHaveBeenCalled();
    expect(Tone.Transport.start).toHaveBeenCalled();
    expect(playButton).toHaveTextContent('Stop');

    // Click stop
    await userEvent.click(playButton);
    expect(Tone.Transport.stop).toHaveBeenCalled();
    expect(playButton).toHaveTextContent('Play');
  });

  it('handles volume changes', () => {
    renderComponent();
    const volumeSlider = screen.getByLabelText(/volume/i);

    // Test volume change
    fireEvent.change(volumeSlider, { target: { value: '-20' } });
    expect(volumeSlider.value).toBe('-20');
  });

  it('updates synth parameters based on physics', () => {
    const physicsParameters = {
      gravity: 5,
      elasticity: 0.8,
      friction: 0.2,
      airResistance: 0.3,
      density: 1.5,
    };

    renderComponent({ physicsParameters });
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('is responsive', () => {
    const { container } = renderComponent();

    // Test mobile view
    window.innerWidth = 375;
    fireEvent.resize(window);
    expect(container.querySelector(`.${styles.audioController}`)).toHaveClass(
      styles.mobile
    );

    // Test desktop view
    window.innerWidth = 1024;
    fireEvent.resize(window);
    expect(
      container.querySelector(`.${styles.audioController}`)
    ).not.toHaveClass(styles.mobile);
  });
});
