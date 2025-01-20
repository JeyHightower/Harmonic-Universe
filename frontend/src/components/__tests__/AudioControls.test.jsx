import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import AudioControlsPage from '../../pages/AudioControlsPage';

const mockStore = configureStore([thunk]);

describe('AudioControls Component', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      audio: {
        loading: false,
        error: null,
        settings: {
          harmony: 0.5,
          tempo: 120,
          key: 'C',
          scale: 'major',
        },
      },
    });
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <AudioControlsPage />
        </BrowserRouter>
      </Provider>
    );
  };

  test('renders all audio control elements', () => {
    renderComponent();

    // Music controls
    expect(screen.getByText(/audio controls/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/harmony/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tempo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/scale/i)).toBeInTheDocument();

    // Info panel
    expect(screen.getByText(/about audio controls/i)).toBeInTheDocument();
  });

  test('handles parameter changes', async () => {
    renderComponent();
    const user = userEvent.setup();

    // Test harmony slider
    const harmonySlider = screen.getByLabelText(/harmony/i);
    await user.click(harmonySlider);
    fireEvent.change(harmonySlider, { target: { value: '0.8' } });
    expect(harmonySlider.value).toBe('0.8');

    // Test tempo slider
    const tempoSlider = screen.getByLabelText(/tempo/i);
    await user.click(tempoSlider);
    fireEvent.change(tempoSlider, { target: { value: '140' } });
    expect(tempoSlider.value).toBe('140');

    // Test key selection
    const keySelect = screen.getByLabelText(/key/i);
    await user.selectOptions(keySelect, 'G');
    expect(keySelect.value).toBe('G');

    // Test scale selection
    const scaleSelect = screen.getByLabelText(/scale/i);
    await user.selectOptions(scaleSelect, 'minor');
    expect(scaleSelect.value).toBe('minor');
  });

  test('displays loading state during updates', async () => {
    store = mockStore({
      audio: {
        loading: true,
        error: null,
        settings: {
          harmony: 0.5,
          tempo: 120,
          key: 'C',
          scale: 'major',
        },
      },
    });

    renderComponent();

    expect(screen.getByText(/updating\.\.\./i)).toBeInTheDocument();
    expect(screen.getByLabelText(/harmony/i)).toBeDisabled();
  });

  test('displays error messages', async () => {
    store = mockStore({
      audio: {
        loading: false,
        error: 'Failed to update audio settings',
        settings: {
          harmony: 0.5,
          tempo: 120,
          key: 'C',
          scale: 'major',
        },
      },
    });

    renderComponent();

    expect(
      screen.getByText(/failed to update audio settings/i)
    ).toBeInTheDocument();
  });

  test('provides real-time audio feedback', async () => {
    const mockAudioContext = {
      createOscillator: jest.fn(() => ({
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
      })),
      createGain: jest.fn(() => ({
        connect: jest.fn(),
        gain: { value: 0 },
      })),
    };

    window.AudioContext = jest.fn(() => mockAudioContext);

    renderComponent();
    const user = userEvent.setup();

    // Change harmony value
    const harmonySlider = screen.getByLabelText(/harmony/i);
    await user.click(harmonySlider);
    fireEvent.change(harmonySlider, { target: { value: '0.8' } });

    // Verify audio feedback was triggered
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  test('maintains settings across page navigation', async () => {
    renderComponent();
    const user = userEvent.setup();

    // Change settings
    const harmonySlider = screen.getByLabelText(/harmony/i);
    await user.click(harmonySlider);
    fireEvent.change(harmonySlider, { target: { value: '0.8' } });

    // Simulate navigation away and back
    const { unmount } = renderComponent();
    unmount();
    renderComponent();

    // Verify settings were preserved
    expect(screen.getByLabelText(/harmony/i)).toHaveValue('0.8');
  });

  test('is responsive on different screen sizes', () => {
    const { container } = renderComponent();

    // Test mobile view
    window.innerWidth = 375;
    fireEvent.resize(window);
    expect(container.querySelector('.mobile-view')).toBeInTheDocument();

    // Test tablet view
    window.innerWidth = 768;
    fireEvent.resize(window);
    expect(container.querySelector('.tablet-view')).toBeInTheDocument();

    // Test desktop view
    window.innerWidth = 1024;
    fireEvent.resize(window);
    expect(container.querySelector('.desktop-view')).toBeInTheDocument();
  });

  test('validates parameter ranges', async () => {
    renderComponent();
    const user = userEvent.setup();

    // Test invalid harmony value
    const harmonySlider = screen.getByLabelText(/harmony/i);
    await user.click(harmonySlider);
    fireEvent.change(harmonySlider, { target: { value: '1.5' } });
    expect(
      screen.getByText(/harmony must be between 0 and 1/i)
    ).toBeInTheDocument();

    // Test invalid tempo value
    const tempoSlider = screen.getByLabelText(/tempo/i);
    await user.click(tempoSlider);
    fireEvent.change(tempoSlider, { target: { value: '250' } });
    expect(
      screen.getByText(/tempo must be between 60 and 200/i)
    ).toBeInTheDocument();
  });

  test('handles keyboard navigation', async () => {
    renderComponent();
    const user = userEvent.setup();

    // Test keyboard navigation between controls
    await user.tab();
    expect(screen.getByLabelText(/harmony/i)).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText(/tempo/i)).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText(/key/i)).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText(/scale/i)).toHaveFocus();
  });
});
