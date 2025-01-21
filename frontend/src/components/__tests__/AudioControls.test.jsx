import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AudioControls from '../AudioControls';

// Mock Web Audio API
class MockAudioContext {
  createOscillator() {
    return {
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { value: 440 },
    };
  }
  createGain() {
    return {
      connect: vi.fn(),
      gain: { value: 0.5 },
    };
  }
  close() {
    return Promise.resolve();
  }
}

global.AudioContext = MockAudioContext;

// Create a slice for audio state
const audioSlice = {
  name: 'audio',
  initialState: {
    loading: false,
    error: null,
    settings: {
      harmony: 0.5,
      tempo: 120,
      key: 'C',
      scale: 'major',
    },
  },
  reducers: {
    setError: (state, action) => {
      state.error = action.payload;
    },
    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
  },
};

describe('AudioControls', () => {
  const defaultProps = {
    harmony: 0.5,
    tempo: 120,
    musicalKey: 'C',
    scale: 'major',
    onParameterChange: vi.fn(),
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  const renderComponent = (props = {}) => {
    return render(<AudioControls {...defaultProps} {...props} />);
  };

  describe('Rendering', () => {
    it('renders all control elements', () => {
      renderComponent();

      expect(screen.getByLabelText(/harmony/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tempo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/key/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/scale/i)).toBeInTheDocument();
    });

    it('renders with default values', () => {
      renderComponent();

      expect(screen.getByLabelText(/harmony/i)).toHaveValue('0.5');
      expect(screen.getByLabelText(/tempo/i)).toHaveValue('120');
      expect(screen.getByLabelText(/key/i)).toHaveValue('C');
      expect(screen.getByLabelText(/scale/i)).toHaveValue('major');
    });

    it('shows loading state when isLoading is true', () => {
      renderComponent({ isLoading: true });

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      expect(screen.getByLabelText(/harmony/i)).toBeDisabled();
      expect(screen.getByLabelText(/tempo/i)).toBeDisabled();
      expect(screen.getByLabelText(/key/i)).toBeDisabled();
      expect(screen.getByLabelText(/scale/i)).toBeDisabled();
    });

    it('shows error message when error is provided', () => {
      const error = 'Test error message';
      renderComponent({ error });

      expect(screen.getByTestId('error-message')).toHaveTextContent(error);
    });
  });

  describe('User Interactions', () => {
    it('handles harmony slider changes', async () => {
      const onParameterChange = vi.fn();
      renderComponent({ onParameterChange });

      const slider = screen.getByLabelText(/harmony/i);
      await userEvent.clear(slider);
      await userEvent.type(slider, '0.8');

      expect(onParameterChange).toHaveBeenCalledWith('harmony', 0.8);
    });

    it('handles tempo slider changes', async () => {
      const onParameterChange = vi.fn();
      renderComponent({ onParameterChange });

      const slider = screen.getByLabelText(/tempo/i);
      await userEvent.clear(slider);
      await userEvent.type(slider, '140');

      expect(onParameterChange).toHaveBeenCalledWith('tempo', 140);
    });

    it('handles key selection changes', async () => {
      const onParameterChange = vi.fn();
      renderComponent({ onParameterChange });

      const select = screen.getByLabelText(/key/i);
      await userEvent.selectOptions(select, 'G');

      expect(onParameterChange).toHaveBeenCalledWith('musicalKey', 'G');
    });

    it('handles scale selection changes', async () => {
      const onParameterChange = vi.fn();
      renderComponent({ onParameterChange });

      const select = screen.getByLabelText(/scale/i);
      await userEvent.selectOptions(select, 'minor');

      expect(onParameterChange).toHaveBeenCalledWith('scale', 'minor');
    });
  });

  describe('Validation', () => {
    it('shows validation error for harmony out of range', async () => {
      const onParameterChange = vi.fn();
      renderComponent({ onParameterChange });

      const slider = screen.getByLabelText(/harmony/i);
      await userEvent.clear(slider);
      await userEvent.type(slider, '1.5');

      expect(screen.getByTestId('validation-error')).toHaveTextContent(
        /harmony must be between 0 and 1/i
      );
      expect(onParameterChange).not.toHaveBeenCalled();
    });

    it('shows validation error for tempo out of range', async () => {
      const onParameterChange = vi.fn();
      renderComponent({ onParameterChange });

      const slider = screen.getByLabelText(/tempo/i);
      await userEvent.clear(slider);
      await userEvent.type(slider, '250');

      expect(screen.getByTestId('validation-error')).toHaveTextContent(
        /tempo must be between 60 and 200/i
      );
      expect(onParameterChange).not.toHaveBeenCalled();
    });
  });

  describe('Responsive Behavior', () => {
    it('adapts to mobile view', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      const { container } = renderComponent();
      expect(
        container.querySelector('._mobile-view_ff8cf6')
      ).toBeInTheDocument();
    });

    it('adapts to desktop view', () => {
      global.innerWidth = 1024;
      global.dispatchEvent(new Event('resize'));

      const { container } = renderComponent();
      expect(
        container.querySelector('._desktop-view_ff8cf6')
      ).toBeInTheDocument();
    });
  });

  describe('Audio Context Integration', () => {
    it('creates and manages audio context correctly', async () => {
      const audioContext = new AudioContext();
      const onParameterChange = vi.fn();
      renderComponent({ onParameterChange });

      const slider = screen.getByLabelText(/harmony/i);
      await userEvent.clear(slider);
      await userEvent.type(slider, '0.8');

      expect(audioContext.createOscillator).toHaveBeenCalled();
      expect(audioContext.createGain).toHaveBeenCalled();
    });

    it('cleans up audio context on unmount', () => {
      const audioContext = new AudioContext();
      const { unmount } = renderComponent();

      unmount();
      expect(audioContext.close).toHaveBeenCalled();
    });
  });
});
