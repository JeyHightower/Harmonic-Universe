import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  WebSocketProvider,
  useWebSocket,
} from '../../components/WebSocket/WebSocketProvider';

const mockStore = configureMockStore([thunk]);

// Mock WebSocket client
jest.mock('../../services/WebSocketClient', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    joinRoom: jest.fn(),
    leaveRoom: jest.fn(),
    updateParameters: jest.fn(),
    requestMusicGeneration: jest.fn(),
    requestVisualizationUpdate: jest.fn(),
  }));
});

// Test component that uses the WebSocket context
const TestComponent = () => {
  const ws = useWebSocket();
  return (
    <div>
      <div data-testid="connection-status">
        {ws.connected ? 'Connected' : 'Disconnected'}
      </div>
      <button onClick={() => ws.joinRoom('test-room')}>Join Room</button>
      <button onClick={() => ws.leaveRoom('test-room')}>Leave Room</button>
    </div>
  );
};

describe('WebSocketProvider', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      auth: {
        token: 'test-token',
        isAuthenticated: true,
      },
      websocket: {
        connected: false,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('provides WebSocket context to children', () => {
    render(
      <Provider store={store}>
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      </Provider>
    );

    expect(screen.getByTestId('connection-status')).toHaveTextContent(
      'Disconnected'
    );
  });

  test('connects WebSocket when authenticated', () => {
    const WebSocketClient = require('../../services/WebSocketClient');
    render(
      <Provider store={store}>
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      </Provider>
    );

    expect(WebSocketClient).toHaveBeenCalled();
    expect(WebSocketClient.mock.results[0].value.connect).toHaveBeenCalledWith(
      'test-token'
    );
  });

  test('does not connect when not authenticated', () => {
    store = mockStore({
      auth: {
        token: null,
        isAuthenticated: false,
      },
      websocket: {
        connected: false,
      },
    });

    const WebSocketClient = require('../../services/WebSocketClient');
    render(
      <Provider store={store}>
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      </Provider>
    );

    expect(
      WebSocketClient.mock.results[0].value.connect
    ).not.toHaveBeenCalled();
  });

  test('disconnects on unmount', () => {
    const WebSocketClient = require('../../services/WebSocketClient');
    const { unmount } = render(
      <Provider store={store}>
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      </Provider>
    );

    unmount();
    expect(WebSocketClient.mock.results[0].value.disconnect).toHaveBeenCalled();
  });

  test('updates connection status when connected', () => {
    store = mockStore({
      auth: {
        token: 'test-token',
        isAuthenticated: true,
      },
      websocket: {
        connected: true,
      },
    });

    render(
      <Provider store={store}>
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      </Provider>
    );

    expect(screen.getByTestId('connection-status')).toHaveTextContent(
      'Connected'
    );
  });

  test('throws error when useWebSocket is used outside provider', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useWebSocket must be used within a WebSocketProvider');

    consoleError.mockRestore();
  });

  test('provides WebSocket methods to children', () => {
    const WebSocketClient = require('../../services/WebSocketClient');
    const mockClient = WebSocketClient.mock.results[0].value;

    render(
      <Provider store={store}>
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      </Provider>
    );

    // Test join room
    act(() => {
      screen.getByText('Join Room').click();
    });
    expect(mockClient.joinRoom).toHaveBeenCalledWith('test-room');

    // Test leave room
    act(() => {
      screen.getByText('Leave Room').click();
    });
    expect(mockClient.leaveRoom).toHaveBeenCalledWith('test-room');
  });
});
