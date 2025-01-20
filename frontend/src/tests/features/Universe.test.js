import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import UniverseBuilderPage from '../../pages/UniverseBuilderPage';

const mockStore = configureStore([thunk]);

describe('Universe Creation', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      universe: {
        status: 'idle',
        error: null,
      },
    });
  });

  const renderWithProviders = component => {
    return render(
      <Provider store={store}>
        <BrowserRouter>{component}</BrowserRouter>
      </Provider>
    );
  };

  test('renders universe creation form', () => {
    renderWithProviders(<UniverseBuilderPage />);
    expect(screen.getByText('Create New Universe')).toBeInTheDocument();
    expect(screen.getByLabelText('Universe Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    renderWithProviders(<UniverseBuilderPage />);
    const submitButton = screen.getByText('Create Universe');

    fireEvent.click(submitButton);
    expect(screen.getByLabelText('Universe Name')).toBeInvalid();
  });

  test('handles universe creation success', async () => {
    const mockUniverse = {
      id: 'test-id',
      name: 'Test Universe',
      description: 'Test Description',
      is_public: true,
      physics_parameters: {
        gravity: 9.81,
        friction: 0.5,
        elasticity: 0.7,
        airResistance: 0.1,
        density: 1.0,
      },
      music_parameters: {
        harmony: 1.0,
        tempo: 120,
        key: 'C',
        scale: 'major',
      },
      visualization_parameters: {
        brightness: 0.8,
        saturation: 0.7,
        complexity: 0.5,
        colorScheme: 'rainbow',
      },
    };

    store.dispatch = jest.fn().mockResolvedValue({ payload: mockUniverse });

    renderWithProviders(<UniverseBuilderPage />);

    fireEvent.change(screen.getByLabelText('Universe Name'), {
      target: { value: 'Test Universe' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Test Description' },
    });

    fireEvent.click(screen.getByText('Create Universe'));

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  test('handles universe creation error', async () => {
    store.dispatch = jest.fn().mockRejectedValue({
      message: 'Failed to create universe',
    });

    renderWithProviders(<UniverseBuilderPage />);

    fireEvent.change(screen.getByLabelText('Universe Name'), {
      target: { value: 'Test Universe' },
    });
    fireEvent.click(screen.getByText('Create Universe'));

    await waitFor(() => {
      expect(screen.getByText('Failed to create universe')).toBeInTheDocument();
    });
  });
});

describe('Parameter Controls', () => {
  test('updates physics parameters', async () => {
    renderWithProviders(<UniverseBuilderPage />);

    const gravityInput = screen.getByLabelText('Gravity');
    fireEvent.change(gravityInput, { target: { value: '5.0' } });
    expect(gravityInput.value).toBe('5.0');

    const airResistanceInput = screen.getByLabelText('Air Resistance');
    fireEvent.change(airResistanceInput, { target: { value: '0.8' } });
    expect(airResistanceInput.value).toBe('0.8');

    const timeScaleInput = screen.getByLabelText('Time Scale');
    fireEvent.change(timeScaleInput, { target: { value: '1.5' } });
    expect(timeScaleInput.value).toBe('1.5');
  });

  test('updates music parameters', async () => {
    renderWithProviders(<UniverseBuilderPage />);

    const tempoInput = screen.getByLabelText('Tempo');
    fireEvent.change(tempoInput, { target: { value: '140' } });
    expect(tempoInput.value).toBe('140');

    const keySelect = screen.getByLabelText('Key');
    fireEvent.change(keySelect, { target: { value: 'G' } });
    expect(keySelect.value).toBe('G');

    const rhythmComplexityInput = screen.getByLabelText('Rhythm Complexity');
    fireEvent.change(rhythmComplexityInput, { target: { value: '0.7' } });
    expect(rhythmComplexityInput.value).toBe('0.7');

    const melodyRangeInput = screen.getByLabelText('Melody Range');
    fireEvent.change(melodyRangeInput, { target: { value: '0.8' } });
    expect(melodyRangeInput.value).toBe('0.8');
  });

  test('updates visualization parameters', async () => {
    renderWithProviders(<UniverseBuilderPage />);

    const brightnessInput = screen.getByLabelText('Brightness');
    fireEvent.change(brightnessInput, { target: { value: '0.6' } });
    expect(brightnessInput.value).toBe('0.6');

    const colorSchemeSelect = screen.getByLabelText('Color Scheme');
    fireEvent.change(colorSchemeSelect, { target: { value: 'monochrome' } });
    expect(colorSchemeSelect.value).toBe('monochrome');

    const particleCountInput = screen.getByLabelText('Particle Count');
    fireEvent.change(particleCountInput, { target: { value: '5000' } });
    expect(particleCountInput.value).toBe('5000');

    const glowIntensityInput = screen.getByLabelText('Glow Intensity');
    fireEvent.change(glowIntensityInput, { target: { value: '0.8' } });
    expect(glowIntensityInput.value).toBe('0.8');

    const cameraZoomInput = screen.getByLabelText('Camera Zoom');
    fireEvent.change(cameraZoomInput, { target: { value: '2.5' } });
    expect(cameraZoomInput.value).toBe('2.5');
  });
});

describe('Parameter Integration', () => {
  test('physics changes affect music parameters', async () => {
    renderWithProviders(<UniverseBuilderPage />);

    const gravityInput = screen.getByLabelText('Gravity');
    fireEvent.change(gravityInput, { target: { value: '15.0' } });

    await waitFor(() => {
      const harmonyInput = screen.getByLabelText('Harmony');
      expect(parseFloat(harmonyInput.value)).toBeGreaterThan(0);
    });
  });

  test('music changes affect visualization', async () => {
    renderWithProviders(<UniverseBuilderPage />);

    const tempoInput = screen.getByLabelText('Tempo');
    fireEvent.change(tempoInput, { target: { value: '180' } });

    await waitFor(() => {
      const complexityInput = screen.getByLabelText('Complexity');
      expect(parseFloat(complexityInput.value)).toBeGreaterThan(0);
    });
  });
});

describe('AI Integration', () => {
  test('requests AI parameter suggestions', async () => {
    store.dispatch = jest.fn().mockResolvedValue({
      payload: {
        suggestions: {
          physics_parameters: { gravity: 12.5 },
          music_parameters: { tempo: 140 },
          visualization_parameters: { complexity: 0.7 },
        },
        explanation: 'Optimized for dynamic movement',
      },
    });

    renderWithProviders(<UniverseBuilderPage />);

    const suggestButton = screen.getByText('Get AI Suggestions');
    fireEvent.click(suggestButton);

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(expect.any(Function));
      expect(
        screen.getByText('Optimized for dynamic movement')
      ).toBeInTheDocument();
    });
  });
});

describe('Real-time Updates', () => {
  test('updates parameters in real-time', async () => {
    const mockWebSocket = {
      send: jest.fn(),
      addEventListener: jest.fn(),
    };
    window.WebSocket = jest.fn(() => mockWebSocket);

    renderWithProviders(<UniverseBuilderPage />);

    const gravityInput = screen.getByLabelText('Gravity');
    fireEvent.change(gravityInput, { target: { value: '10.0' } });

    await waitFor(() => {
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"gravity":10.0')
      );
    });
  });

  test('receives parameter updates from WebSocket', async () => {
    const mockWebSocket = {
      send: jest.fn(),
      addEventListener: jest.fn(),
    };
    window.WebSocket = jest.fn(() => mockWebSocket);

    renderWithProviders(<UniverseBuilderPage />);

    // Simulate receiving WebSocket message
    const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
      call => call[0] === 'message'
    )[1];

    messageHandler({
      data: JSON.stringify({
        type: 'parameter_update',
        data: {
          physics_parameters: { gravity: 8.0 },
          music_parameters: { tempo: 160 },
          visualization_parameters: { brightness: 0.9 },
        },
      }),
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Gravity').value).toBe('8.0');
      expect(screen.getByLabelText('Tempo').value).toBe('160');
      expect(screen.getByLabelText('Brightness').value).toBe('0.9');
    });
  });
});
