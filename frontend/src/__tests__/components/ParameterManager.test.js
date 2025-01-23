import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { ParameterManager } from '../../components/Universe/ParameterManager';
import { WebSocketService } from '../../services/websocket';
import { updateParameter } from '../../store/slices/universeSlice';

jest.mock('../../services/websocket');

const mockStore = configureStore([thunk]);

describe('ParameterManager', () => {
  let store;
  const mockUniverse = {
    id: '123',
    name: 'Test Universe',
    parameters: {
      physics: {
        gravity: 9.81,
        friction: 0.5
      },
      music: {
        tempo: 120,
        key: 'C'
      },
      visual: {
        brightness: 0.8,
        contrast: 1.2
      }
    }
  };

  beforeEach(() => {
    store = mockStore({
      universe: {
        currentUniverse: mockUniverse,
        loading: false,
        error: null
      }
    });
    WebSocketService.mockClear();
  });

  test('renders parameter manager', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ParameterManager universe={mockUniverse} />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(/physics parameters/i)).toBeInTheDocument();
    expect(screen.getByText(/music parameters/i)).toBeInTheDocument();
    expect(screen.getByText(/visual parameters/i)).toBeInTheDocument();

    // Physics parameters
    expect(screen.getByLabelText(/gravity/i)).toHaveValue(9.81);
    expect(screen.getByLabelText(/friction/i)).toHaveValue(0.5);

    // Music parameters
    expect(screen.getByLabelText(/tempo/i)).toHaveValue(120);
    expect(screen.getByLabelText(/key/i)).toHaveValue('C');

    // Visual parameters
    expect(screen.getByLabelText(/brightness/i)).toHaveValue(0.8);
    expect(screen.getByLabelText(/contrast/i)).toHaveValue(1.2);
  });

  test('updates physics parameter', async () => {
    store.dispatch = jest.fn().mockResolvedValue({
      payload: {
        ...mockUniverse,
        parameters: {
          ...mockUniverse.parameters,
          physics: {
            ...mockUniverse.parameters.physics,
            gravity: 8.0
          }
        }
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ParameterManager universe={mockUniverse} />
        </BrowserRouter>
      </Provider>
    );

    const gravityInput = screen.getByLabelText(/gravity/i);
    fireEvent.change(gravityInput, { target: { value: 8.0 } });

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        updateParameter({
          universeId: mockUniverse.id,
          parameter: {
            type: 'physics',
            name: 'gravity',
            value: 8.0
          }
        })
      );
    });
  });

  test('updates music parameter', async () => {
    store.dispatch = jest.fn().mockResolvedValue({
      payload: {
        ...mockUniverse,
        parameters: {
          ...mockUniverse.parameters,
          music: {
            ...mockUniverse.parameters.music,
            tempo: 140
          }
        }
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ParameterManager universe={mockUniverse} />
        </BrowserRouter>
      </Provider>
    );

    const tempoInput = screen.getByLabelText(/tempo/i);
    fireEvent.change(tempoInput, { target: { value: 140 } });

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        updateParameter({
          universeId: mockUniverse.id,
          parameter: {
            type: 'music',
            name: 'tempo',
            value: 140
          }
        })
      );
    });
  });

  test('updates visual parameter', async () => {
    store.dispatch = jest.fn().mockResolvedValue({
      payload: {
        ...mockUniverse,
        parameters: {
          ...mockUniverse.parameters,
          visual: {
            ...mockUniverse.parameters.visual,
            brightness: 1.0
          }
        }
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ParameterManager universe={mockUniverse} />
        </BrowserRouter>
      </Provider>
    );

    const brightnessInput = screen.getByLabelText(/brightness/i);
    fireEvent.change(brightnessInput, { target: { value: 1.0 } });

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        updateParameter({
          universeId: mockUniverse.id,
          parameter: {
            type: 'visual',
            name: 'brightness',
            value: 1.0
          }
        })
      );
    });
  });

  test('validates parameter ranges', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ParameterManager universe={mockUniverse} />
        </BrowserRouter>
      </Provider>
    );

    const gravityInput = screen.getByLabelText(/gravity/i);
    fireEvent.change(gravityInput, { target: { value: -1 } });

    expect(screen.getByText(/gravity must be positive/i)).toBeInTheDocument();
  });

  test('handles WebSocket updates', async () => {
    const mockWebSocket = {
      on: jest.fn(),
      emit: jest.fn()
    };
    WebSocketService.mockImplementation(() => mockWebSocket);

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ParameterManager universe={mockUniverse} />
        </BrowserRouter>
      </Provider>
    );

    // Simulate receiving a WebSocket update
    const parameterUpdate = {
      type: 'physics',
      name: 'gravity',
      value: 10.0
    };
    const callback = mockWebSocket.on.mock.calls.find(
      call => call[0] === 'parameter_updated'
    )[1];
    callback(parameterUpdate);

    await waitFor(() => {
      const gravityInput = screen.getByLabelText(/gravity/i);
      expect(gravityInput).toHaveValue(10.0);
    });
  });

  test('displays error message', () => {
    const error = 'Failed to update parameter';
    store = mockStore({
      universe: {
        currentUniverse: mockUniverse,
        loading: false,
        error
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ParameterManager universe={mockUniverse} />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(error)).toBeInTheDocument();
  });

  test('displays loading state', () => {
    store = mockStore({
      universe: {
        currentUniverse: mockUniverse,
        loading: true,
        error: null
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ParameterManager universe={mockUniverse} />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
