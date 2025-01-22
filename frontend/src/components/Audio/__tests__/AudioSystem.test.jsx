import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioProvider } from '../AudioContext';
import AudioControls from '../AudioControls';
import AudioVisualizer from '../AudioVisualizer';

// Mock AudioContext and related classes
class MockAudioContext {
  constructor() {
    this.state = 'suspended';
    this.destination = {
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createOscillator() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { value: 440, setValueAtTime: vi.fn() },
    };
  }

  createGain() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
      gain: { value: 1, setValueAtTime: vi.fn() },
    };
  }

  createAnalyser() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
      frequencyBinCount: 1024,
      getByteFrequencyData: vi.fn(),
      getByteTimeDomainData: vi.fn(),
    };
  }

  resume() {
    this.state = 'running';
    return Promise.resolve();
  }

  suspend() {
    this.state = 'suspended';
    return Promise.resolve();
  }

  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

global.AudioContext = MockAudioContext;

describe('Audio System', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        audio: (
          state = {
            isPlaying: false,
            volume: 0.5,
            isMuted: false,
            effects: {
              reverb: 0.3,
              delay: 0.2,
            },
            error: null,
          },
          action
        ) => state,
      },
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = component => {
    return render(
      <Provider store={store}>
        <AudioProvider>{component}</AudioProvider>
      </Provider>
    );
  };

  describe('AudioControls Component', () => {
    it('renders audio controls correctly', () => {
      renderWithProviders(<AudioControls />);

      expect(screen.getByTestId('play-button')).toBeInTheDocument();
      expect(screen.getByTestId('volume-slider')).toBeInTheDocument();
      expect(screen.getByTestId('mute-button')).toBeInTheDocument();
    });

    it('toggles play/pause state', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AudioControls />);

      const playButton = screen.getByTestId('play-button');
      await user.click(playButton);
      expect(playButton).toHaveAttribute('aria-label', 'Pause');

      await user.click(playButton);
      expect(playButton).toHaveAttribute('aria-label', 'Play');
    });

    it('adjusts volume', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AudioControls />);

      const volumeSlider = screen.getByTestId('volume-slider');
      await user.type(volumeSlider, '75');
      expect(volumeSlider).toHaveValue('75');
    });

    it('toggles mute state', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AudioControls />);

      const muteButton = screen.getByTestId('mute-button');
      await user.click(muteButton);
      expect(muteButton).toHaveAttribute('aria-label', 'Unmute');

      await user.click(muteButton);
      expect(muteButton).toHaveAttribute('aria-label', 'Mute');
    });

    it('applies audio effects', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AudioControls />);

      await user.click(screen.getByTestId('effects-button'));

      const reverbSlider = screen.getByTestId('reverb-amount');
      const delaySlider = screen.getByTestId('delay-amount');

      await user.type(reverbSlider, '0.5');
      await user.type(delaySlider, '0.3');

      expect(reverbSlider).toHaveValue('0.5');
      expect(delaySlider).toHaveValue('0.3');
    });
  });

  describe('AudioVisualizer Component', () => {
    it('renders canvas elements', () => {
      renderWithProviders(<AudioVisualizer />);

      expect(screen.getByTestId('waveform-canvas')).toBeInTheDocument();
      expect(screen.getByTestId('spectrum-canvas')).toBeInTheDocument();
    });

    it('updates visualizations when audio is playing', async () => {
      const mockAnalyser = new MockAudioContext().createAnalyser();
      const mockData = new Uint8Array(1024).fill(128);
      mockAnalyser.getByteFrequencyData.mockImplementation(array => {
        array.set(mockData);
      });

      renderWithProviders(<AudioVisualizer analyser={mockAnalyser} />);

      // Wait for a few animation frames
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockAnalyser.getByteFrequencyData).toHaveBeenCalled();
      expect(mockAnalyser.getByteTimeDomainData).toHaveBeenCalled();
    });

    it('stops visualization when component unmounts', () => {
      const { unmount } = renderWithProviders(<AudioVisualizer />);
      unmount();
      // Verify that animation frame is cancelled
      expect(window.cancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('Audio Context Integration', () => {
    it('initializes audio context when needed', async () => {
      renderWithProviders(<AudioControls />);
      const playButton = screen.getByTestId('play-button');
      await userEvent.click(playButton);

      expect(global.AudioContext).toHaveBeenCalled();
    });

    it('handles audio context state changes', async () => {
      const audioContext = new MockAudioContext();
      renderWithProviders(<AudioControls audioContext={audioContext} />);

      await userEvent.click(screen.getByTestId('play-button'));
      expect(audioContext.state).toBe('running');

      await userEvent.click(screen.getByTestId('play-button'));
      expect(audioContext.state).toBe('suspended');
    });

    it('cleans up audio context on unmount', () => {
      const audioContext = new MockAudioContext();
      const { unmount } = renderWithProviders(
        <AudioControls audioContext={audioContext} />
      );

      unmount();
      expect(audioContext.state).toBe('closed');
    });
  });

  describe('Error Handling', () => {
    it('displays error message when audio fails to initialize', async () => {
      global.AudioContext = vi.fn().mockImplementation(() => {
        throw new Error('Audio initialization failed');
      });

      renderWithProviders(<AudioControls />);
      await userEvent.click(screen.getByTestId('play-button'));

      expect(
        screen.getByText(/audio initialization failed/i)
      ).toBeInTheDocument();
    });

    it('handles unsupported browser error', () => {
      global.AudioContext = undefined;
      renderWithProviders(<AudioControls />);

      expect(
        screen.getByText(/audio is not supported in this browser/i)
      ).toBeInTheDocument();
    });

    it('recovers from audio context errors', async () => {
      const audioContext = new MockAudioContext();
      audioContext.resume = vi
        .fn()
        .mockRejectedValueOnce(new Error('Resume failed'))
        .mockResolvedValueOnce();

      renderWithProviders(<AudioControls audioContext={audioContext} />);

      await userEvent.click(screen.getByTestId('play-button'));
      expect(screen.getByText(/resume failed/i)).toBeInTheDocument();

      await userEvent.click(screen.getByTestId('play-button'));
      expect(screen.queryByText(/resume failed/i)).not.toBeInTheDocument();
    });
  });
});
